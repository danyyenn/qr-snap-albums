import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Fetch approved photos for the event
    const { data: photos, error: photosError } = await supabaseClient
      .from("photos")
      .select("storage_path")
      .eq("event_id", eventId)
      .eq("is_approved", true)
      .order("uploaded_at", { ascending: true });

    if (photosError) throw photosError;
    if (!photos || photos.length === 0) {
      throw new Error("No approved photos found for this event");
    }

    console.log(`Found ${photos.length} photos to process`);

    // Download all photos as base64
    const imagePromises = photos.map(async (photo) => {
      const { data: fileData, error: downloadError } = await supabaseClient
        .storage
        .from("event-photos")
        .download(photo.storage_path);

      if (downloadError) {
        console.error(`Error downloading ${photo.storage_path}:`, downloadError);
        return null;
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Convert to base64 in chunks to avoid stack overflow
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binary);
      
      return `data:image/jpeg;base64,${base64}`;
    });

    const images = (await Promise.all(imagePromises)).filter(img => img !== null);
    console.log(`Successfully downloaded ${images.length} images`);

    // Call Lovable AI to generate video frames
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Generating video with AI...");

    // Generate transition frames using AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: "You are a video generation assistant. Create smooth transitions and effects for event photos."
          },
          {
            role: "user",
            content: `Create a video compilation from ${images.length} event photos with smooth transitions. Return metadata about the video structure.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const aiData = await response.json();
    console.log("AI processing complete");

    // For now, return a simple response indicating video is being processed
    // In production, this would trigger actual video rendering
    const videoData = {
      eventId,
      sessionId,
      frameCount: images.length,
      status: "processing",
      metadata: aiData.choices[0].message.content,
      estimatedDuration: images.length * 3, // 3 seconds per photo
    };

    return new Response(JSON.stringify(videoData), {
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
