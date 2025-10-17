import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the WebM video data from the request
    const formData = await req.formData();
    const webmFile = formData.get("video") as File;
    
    if (!webmFile) {
      throw new Error("No video file provided");
    }

    console.log(`Received WebM file: ${webmFile.size} bytes`);

    // Create a temporary directory for processing
    const tempDir = await Deno.makeTempDir();
    const inputPath = `${tempDir}/input.webm`;
    const outputPath = `${tempDir}/output.mp4`;

    // Write the WebM file to disk
    const webmBytes = await webmFile.arrayBuffer();
    await Deno.writeFile(inputPath, new Uint8Array(webmBytes));
    console.log("WebM file written to temporary directory");

    // Convert WebM to MP4 using FFmpeg
    console.log("Starting FFmpeg conversion...");
    const ffmpegProcess = new Deno.Command("ffmpeg", {
      args: [
        "-i", inputPath,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-y",
        outputPath
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await ffmpegProcess.output();
    
    if (code !== 0) {
      const errorOutput = new TextDecoder().decode(stderr);
      console.error("FFmpeg error:", errorOutput);
      throw new Error(`FFmpeg conversion failed with code ${code}`);
    }

    console.log("FFmpeg conversion completed successfully");

    // Read the output MP4 file
    const mp4Data = await Deno.readFile(outputPath);
    console.log(`MP4 file size: ${mp4Data.length} bytes`);

    // Generate a unique filename
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().slice(0, 8);
    const filename = `starfield-${timestamp}-${randomId}.mp4`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from("astro_spot_images")
      .upload(`videos/${filename}`, mp4Data, {
        contentType: "video/mp4",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    console.log("MP4 uploaded to storage:", uploadData.path);

    // Get the public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from("astro_spot_images")
      .getPublicUrl(`videos/${filename}`);

    // Clean up temporary files
    await Deno.remove(tempDir, { recursive: true });
    console.log("Temporary files cleaned up");

    return new Response(
      JSON.stringify({ 
        url: publicUrl,
        filename: filename,
        size: mp4Data.length 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error generating MP4:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
