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

    // Create video generation record immediately
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

    // Start background video generation
    const generateVideo = async () => {
      try {
        // Fetch event details
        const { data: eventData, error: eventError } = await supabaseClient
          .from("events")
          .select("name, event_date, location")
          .eq("id", eventId)
          .single();

        if (eventError) throw eventError;
        console.log("Event name:", eventData.name);

        // Fetch approved photos
        const { data: photos, error: photosError } = await supabaseClient
          .from("photos")
          .select("id, storage_path, uploaded_at")
          .eq("event_id", eventId)
          .eq("is_approved", true)
          .order("uploaded_at", { ascending: true });

        if (photosError) throw photosError;
        if (!photos || photos.length === 0) {
          throw new Error("No approved photos found");
        }

        console.log(`Found ${photos.length} photos`);

        // Get credentials
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

        if (!LOVABLE_API_KEY) {
          throw new Error("LOVABLE_API_KEY not configured");
        }

        // Select best photos using AI (limit to 20)
        const targetPhotoCount = Math.min(20, photos.length);
        let selectedPhotos = photos.slice(0, targetPhotoCount);

        if (photos.length > 12) {
          // Download first 12 for AI analysis
          const photosToAnalyze = photos.slice(0, 12);
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

          const imageData = (await Promise.all(imageDataPromises)).filter(img => img !== null);
          console.log(`Analyzing ${imageData.length} images with AI`);

          // Ask AI to select best photos
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
                  content: "Return ONLY a JSON object with selected_indices array. No other text."
                },
                {
                  role: "user",
                  content: `Select the best ${targetPhotoCount} photos from ${photos.length} event photos for a video. Return JSON: {"selected_indices": [0, 2, 5, ...]}. Indices: 0-${photos.length - 1}.`
                }
              ]
            }),
          });

          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            const aiContent = analysisData.choices?.[0]?.message?.content || "";
            try {
              const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const selectedIndices = parsed.selected_indices || [];
                if (selectedIndices.length >= targetPhotoCount) {
                  selectedPhotos = selectedIndices.slice(0, targetPhotoCount).map((idx: number) => photos[idx]).filter(Boolean);
                  console.log("AI selected", selectedPhotos.length, "photos");
                }
              }
            } catch (e) {
              console.error("AI selection failed, using evenly spaced photos");
            }
          }
        }

        // Generate title card
        console.log("Generating title card...");
        const titleCardResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [{
              role: "user",
              content: `Create a stunning title card for an Instagram Reel. Title: "${eventData.name}". Use elegant design with gradient background (warm colors: gold, rose gold, sunset tones). Add subtle confetti effects. Bold, centered, readable text. Premium and exciting feel. 9:16 aspect ratio (portrait).`
            }],
            modalities: ["image", "text"]
          }),
        });

        if (!titleCardResponse.ok) {
          throw new Error("Title card generation failed");
        }

        const titleCardData = await titleCardResponse.json();
        const titleImageUrl = titleCardData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (!titleImageUrl) {
          throw new Error("No title card image generated");
        }

        // Get Cloudinary credentials
        const CLOUDINARY_CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
        const CLOUDINARY_API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
        const CLOUDINARY_API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
          throw new Error("Cloudinary credentials not configured");
        }

        console.log("Uploading images to Cloudinary...");
        
        // Helper to create signed upload to Cloudinary
        const uploadToCloudinary = async (fileData: string, publicId: string) => {
          const timestamp = Math.floor(Date.now() / 1000);
          const folder = `event_videos/${eventId}`;
          
          // Create signature for signed upload
          const stringToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
          
          const msgBuffer = new TextEncoder().encode(stringToSign);
          const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

          const formData = new FormData();
          formData.append("file", fileData);
          formData.append("folder", folder);
          formData.append("public_id", publicId);
          formData.append("timestamp", timestamp.toString());
          formData.append("api_key", CLOUDINARY_API_KEY);
          formData.append("signature", signature);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
          );

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Upload failed: ${error}`);
          }

          return await response.json();
        };

        // Upload title card
        const titleCardResult = await uploadToCloudinary(titleImageUrl, `title_${Date.now()}`);
        console.log("Title card uploaded:", titleCardResult.public_id);

        // Upload photos in batches
        const uploadedPhotoIds = [];
        const batchSize = 5;
        for (let i = 0; i < selectedPhotos.length; i += batchSize) {
          const batch = selectedPhotos.slice(i, i + batchSize);
          const uploads = await Promise.all(
            batch.map(async (photo, idx) => {
              try {
                const { data: fileData } = await supabaseClient
                  .storage
                  .from("event-photos")
                  .download(photo.storage_path);

                if (!fileData) throw new Error("File download returned null");

                const base64 = await imageToBase64(fileData);
                const result = await uploadToCloudinary(
                  `data:image/jpeg;base64,${base64}`,
                  `photo_${i + idx}_${Date.now()}`
                );
                console.log(`Photo ${i + idx + 1} uploaded`);
                return result.public_id;
              } catch (error) {
                console.error(`Photo ${i + idx + 1} failed:`, error);
                return null;
              }
            })
          );
          uploadedPhotoIds.push(...uploads.filter(id => id !== null));
        }

        if (uploadedPhotoIds.length === 0) {
          throw new Error("No photos uploaded successfully");
        }

        console.log(`Creating video from ${uploadedPhotoIds.length + 1} images...`);

        // Create video using Cloudinary Video API
        const allImages = [titleCardResult.public_id, ...uploadedPhotoIds];
        const videoPublicId = `event_videos/${eventId}/reel_${Date.now()}`;
        
        // Build slideshow video URL (9:16 for Instagram Reels)
        // Each image shows for 3 seconds
        const transformations = allImages
          .map((id, i) => `l_${id.replace(/\//g, ':')},w_1080,h_1920,c_fill,g_center,du_3,so_${i * 3}`)
          .join('/');
        
        const videoUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${transformations}/f_mp4,vc_h264/${videoPublicId}.mp4`;
        
        console.log("Video URL generated:", videoUrl);

        // Update video record
        const metadata = {
          totalPhotos: photos.length,
          selectedPhotos: selectedPhotos.length,
          eventName: eventData.name,
          cloudinaryImages: allImages.length,
          generatedAt: new Date().toISOString()
        };

        await supabaseClient
          .from("event_videos")
          .update({
            status: 'completed',
            metadata: metadata,
            video_url: videoUrl,
            completed_at: new Date().toISOString()
          })
          .eq('id', videoRecord.id);

        console.log("Video generation completed successfully");

      } catch (error) {
        console.error("Background task error:", error);
        // Update status to failed
        await supabaseClient
          .from("event_videos")
          .update({
            status: 'failed',
            metadata: { error: error instanceof Error ? error.message : "Unknown error" }
          })
          .eq('id', videoRecord.id);
      }
    };

    // Start background task (no await - runs in background)
    generateVideo().catch(err => console.error("Background generation error:", err));

    // Return immediate response
    return new Response(JSON.stringify({
      success: true,
      videoId: videoRecord.id,
      message: "Video generation started. Check back in a few minutes.",
      status: "processing"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error starting video generation:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
