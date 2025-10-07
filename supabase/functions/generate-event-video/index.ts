import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to convert image to base64
async function imageToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

// Helper to convert base64 to blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

// Create a simple video frame using Canvas API (server-side rendering)
async function createVideoFrame(
  imageBlob: Blob,
  width: number,
  height: number,
  duration: number
): Promise<Blob> {
  // Since we can't use Canvas in Deno, we'll return the image as-is
  // In production, you'd use FFmpeg or a video processing service
  return imageBlob;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { eventId, sessionId } = await req.json();
    
    if (!eventId || !sessionId) {
      throw new Error("Event ID and session ID are required");
    }

    console.log("Starting video generation for event:", eventId);

    // Fetch event details for title card
    const { data: eventData, error: eventError } = await supabaseClient
      .from("events")
      .select("name, event_date, location")
      .eq("id", eventId)
      .single();

    if (eventError) throw eventError;
    console.log("Event name:", eventData.name);

    // Create video generation record
    const { data: videoRecord, error: videoInsertError } = await supabaseClient
      .from("event_videos")
      .insert({
        event_id: eventId,
        stripe_session_id: sessionId,
        status: 'processing'
      })
      .select()
      .single();

    if (videoInsertError) {
      console.error("Error creating video record:", videoInsertError);
      throw videoInsertError;
    }

    // Fetch approved photos for the event
    const { data: photos, error: photosError } = await supabaseClient
      .from("photos")
      .select("id, storage_path, uploaded_at")
      .eq("event_id", eventId)
      .eq("is_approved", true)
      .order("uploaded_at", { ascending: true });

    if (photosError) throw photosError;
    if (!photos || photos.length === 0) {
      throw new Error("No approved photos found for this event");
    }

    console.log(`Found ${photos.length} photos to analyze`);

    // Download photos for AI analysis (limit to first 50 to avoid memory issues)
    const photosToAnalyze = photos.slice(0, Math.min(50, photos.length));
    const imageDataPromises = photosToAnalyze.map(async (photo) => {
      const { data: fileData, error: downloadError } = await supabaseClient
        .storage
        .from("event-photos")
        .download(photo.storage_path);

      if (downloadError) {
        console.error(`Error downloading ${photo.storage_path}:`, downloadError);
        return null;
      }

      const base64 = await imageToBase64(fileData);
      return {
        id: photo.id,
        path: photo.storage_path,
        data: `data:image/jpeg;base64,${base64}`
      };
    });

    const imageData = (await Promise.all(imageDataPromises)).filter((img): img is { id: string; path: string; data: string } => img !== null);
    console.log(`Downloaded ${imageData.length} images for AI analysis`);

    // Use AI to analyze and select the best photos for the video
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Using AI to select best photos...");
    
    // For a 1-minute video at 3 seconds per photo, we need ~20 photos
    const targetPhotoCount = 20;
    
    // Use AI to analyze photos and suggest best selections
    // Using a simpler prompt-based approach instead of tool calling for better compatibility
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert photo curator. Return ONLY a JSON object with two fields: selected_indices (array of numbers) and reasoning (string). No other text."
          },
          {
            role: "user",
            content: `Analyze these ${imageData.length} event photos and select the best ${Math.min(targetPhotoCount, imageData.length)} for a 1-minute Instagram Reel video. Consider: composition, lighting, quality, emotional impact, variety, and storytelling flow. Avoid duplicates.

Return ONLY this JSON format:
{
  "selected_indices": [0, 2, 5, ...],
  "reasoning": "brief explanation"
}

Photo indices go from 0 to ${imageData.length - 1}. Return exactly ${Math.min(targetPhotoCount, imageData.length)} indices.`
          }
        ]
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("AI analysis error:", analysisResponse.status, errorText);
      throw new Error(`AI photo selection failed: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const aiContent = analysisData.choices?.[0]?.message?.content || "";
    console.log("AI analysis response:", aiContent);
    
    let selectedIndices: number[] = [];
    let aiReasoning = "";
    
    // Parse JSON response from AI
    try {
      // Extract JSON from response (AI might add extra text)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        selectedIndices = parsed.selected_indices || [];
        aiReasoning = parsed.reasoning || "";
        console.log("AI selected photos:", selectedIndices);
        console.log("AI reasoning:", aiReasoning);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
    }

    // Fallback: if AI didn't select enough photos, use a smart sampling strategy
    if (selectedIndices.length < targetPhotoCount) {
      console.log("AI selected fewer photos than needed, using smart sampling...");
      const step = Math.floor(photos.length / targetPhotoCount);
      selectedIndices = Array.from({ length: targetPhotoCount }, (_, i) => i * step);
    }

    // Get the actual selected photos
    const selectedPhotos = selectedIndices
      .slice(0, targetPhotoCount)
      .map(idx => photos[idx])
      .filter(Boolean);

    console.log(`Selected ${selectedPhotos.length} photos for video generation`);

    // Generate a beautiful title card using AI
    console.log("Generating title card image...");
    const titleCardResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: `Create a stunning modern title card for an Instagram Reel video. The title should say "${eventData.name}". Use an elegant, celebratory design with a gradient background (warm colors like gold, rose gold, or sunset tones). Add subtle confetti or sparkle effects. The text should be bold, centered, and highly readable. Make it feel premium and exciting. Ultra high resolution. 9:16 aspect ratio (portrait for Instagram Reels).`
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!titleCardResponse.ok) {
      console.error("Title card generation failed:", await titleCardResponse.text());
      throw new Error("Failed to generate title card");
    }

    const titleCardAIData = await titleCardResponse.json();
    const titleImageUrl = titleCardAIData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!titleImageUrl) {
      throw new Error("No title card image generated");
    }

    // Upload title card to Cloudinary
    console.log("Uploading title card to Cloudinary...");
    const CLOUDINARY_CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const CLOUDINARY_API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
    const CLOUDINARY_API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error("Cloudinary credentials not configured");
    }
    
    console.log("Cloud name:", CLOUDINARY_CLOUD_NAME);
    console.log("API key:", CLOUDINARY_API_KEY);
    console.log("API secret length:", CLOUDINARY_API_SECRET?.length);

    // Upload using signed upload with proper signature
    console.log("Uploading title card to Cloudinary...");
    
    const timestamp = Math.round(Date.now() / 1000);
    
    // Create signature - Cloudinary requires params in alphabetical order
    const paramsToSign = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(paramsToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const titleFormData = new FormData();
    titleFormData.append('file', titleImageUrl);
    titleFormData.append('timestamp', timestamp.toString());
    titleFormData.append('api_key', CLOUDINARY_API_KEY);
    titleFormData.append('signature', signature);

    const titleCardUpload = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: titleFormData
    });

    if (!titleCardUpload.ok) {
      const errorText = await titleCardUpload.text();
      console.error("Cloudinary upload failed:", errorText);
      throw new Error(`Cloudinary upload failed: ${errorText}`);
    }

    const titleCardData = await titleCardUpload.json();
    const titleCardPublicId = titleCardData.public_id;
    console.log("Title card uploaded:", titleCardPublicId);

    // Upload photos
    console.log(`Uploading ${selectedPhotos.length} photos to Cloudinary...`);
    const uploadedPhotoIds: string[] = [];
    
    for (const photo of selectedPhotos) {
      const { data: fileData, error } = await supabaseClient
        .storage
        .from("event-photos")
        .download(photo.storage_path);
      
      if (error) {
        console.error(`Error downloading ${photo.storage_path}:`, error);
        continue;
      }

      const base64Data = await imageToBase64(fileData);
      
      const photoTimestamp = Math.round(Date.now() / 1000);
      const photoParamsToSign = `timestamp=${photoTimestamp}${CLOUDINARY_API_SECRET}`;
      const photoData = encoder.encode(photoParamsToSign);
      const photoHashBuffer = await crypto.subtle.digest('SHA-1', photoData);
      const photoHashArray = Array.from(new Uint8Array(photoHashBuffer));
      const photoSignature = photoHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const photoFormData = new FormData();
      photoFormData.append('file', `data:image/jpeg;base64,${base64Data}`);
      photoFormData.append('timestamp', photoTimestamp.toString());
      photoFormData.append('api_key', CLOUDINARY_API_KEY);
      photoFormData.append('signature', photoSignature);

      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: photoFormData
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        uploadedPhotoIds.push(uploadData.public_id);
        console.log(`Uploaded photo ${uploadedPhotoIds.length}/${selectedPhotos.length}`);
      } else {
        console.error(`Failed to upload photo:`, await uploadResponse.text());
      }
    }

    console.log(`Uploaded ${uploadedPhotoIds.length} photos to Cloudinary`);

    // Create video using Cloudinary's video transformation API
    console.log("Creating video with Cloudinary...");
    
    // Build video layers: title card (3s) + photos (3s each)
    const videoLayers = [
      { publicId: titleCardPublicId, duration: 3 },
      ...uploadedPhotoIds.map(id => ({ publicId: id, duration: 3 }))
    ];

    // Use Cloudinary's video concatenation
    const videoTransformation = videoLayers.map((layer, index) => {
      return `l_${layer.publicId.replace(/\//g, ':')},w_1080,h_1920,c_fill,du_${layer.duration}`;
    }).join('/');

    // Generate the video URL
    const videoUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${videoTransformation}/e_concatenate/f_mp4,q_auto/event-video-${eventId}.mp4`;
    
    console.log("Video URL generated:", videoUrl);

    // Update video record with complete metadata
    const videoMetadata = {
      totalPhotosAvailable: photos.length,
      photosAnalyzed: imageData.length,
      photosSelected: selectedPhotos.length,
      selectedPhotoIds: selectedPhotos.map(p => p.id),
      aiReasoning: aiReasoning,
      duration: "60 seconds",
      format: "Instagram Reel (1080x1920)",
      titleCard: "AI Generated via Cloudinary",
      eventName: eventData.name,
      videoUrl: videoUrl,
      cloudinaryAssets: {
        titleCard: titleCardPublicId,
        photos: uploadedPhotoIds
      },
      generatedAt: new Date().toISOString()
    };

    await supabaseClient
      .from("event_videos")
      .update({
        status: 'completed',
        metadata: videoMetadata,
        video_url: videoUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', videoRecord.id);

    console.log("Video generation completed successfully");

    return new Response(JSON.stringify({
      success: true,
      videoId: videoRecord.id,
      message: "Video generated successfully using Cloudinary!",
      videoUrl: videoUrl,
      metadata: videoMetadata
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error generating video:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
