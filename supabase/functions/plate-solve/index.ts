import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASTROMETRY_API_URL = "https://nova.astrometry.net/api";

interface AstrometrySession {
  status: string;
  session: string;
}

interface SubmissionResponse {
  status: string;
  subid: number;
}

interface JobStatus {
  status: string;
  jobs: number[];
}

interface JobResult {
  status: string;
  calibration?: {
    ra: number;
    dec: number;
    radius: number;
    pixscale: number;
    orientation: number;
    parity: number;
  };
  objects_in_field?: string[];
  machine_tags?: string[];
  tags?: string[];
}

async function login(apiKey: string): Promise<string> {
  console.log("Logging into Astrometry.net...");
  const response = await fetch(`${ASTROMETRY_API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `request-json=${encodeURIComponent(JSON.stringify({ apikey: apiKey }))}`,
  });

  const data: AstrometrySession = await response.json();
  if (data.status !== "success") {
    throw new Error("Failed to login to Astrometry.net");
  }
  console.log("Login successful, session:", data.session);
  return data.session;
}

async function submitImage(session: string, imageBase64: string): Promise<number> {
  console.log("Submitting image to Astrometry.net...");
  
  // Extract base64 data from data URL
  const base64Data = imageBase64.split(",")[1] || imageBase64;
  
  // Create form data for URL upload (more reliable than direct base64)
  const requestData = {
    session: session,
    publicly_visible: "n",
    allow_modifications: "d",
    allow_commercial_use: "d",
    // Use inline upload
    scale_units: "degwidth",
    scale_lower: 0.1,
    scale_upper: 180,
    scale_type: "ul",
  };

  // For direct upload, we need to use multipart form
  const boundary = "----AstrometryBoundary" + Date.now();
  const formParts: string[] = [];

  // Add JSON request
  formParts.push(`--${boundary}`);
  formParts.push('Content-Disposition: form-data; name="request-json"');
  formParts.push("");
  formParts.push(JSON.stringify(requestData));

  // Add file
  formParts.push(`--${boundary}`);
  formParts.push('Content-Disposition: form-data; name="file"; filename="image.jpg"');
  formParts.push("Content-Type: image/jpeg");
  formParts.push("Content-Transfer-Encoding: base64");
  formParts.push("");
  formParts.push(base64Data);
  formParts.push(`--${boundary}--`);

  const formBody = formParts.join("\r\n");

  const response = await fetch(`${ASTROMETRY_API_URL}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: formBody,
  });

  const data: SubmissionResponse = await response.json();
  console.log("Upload response:", data);
  
  if (data.status !== "success") {
    throw new Error("Failed to submit image to Astrometry.net");
  }
  
  return data.subid;
}

async function waitForJob(submissionId: number, maxWaitSeconds: number = 120): Promise<number | null> {
  console.log(`Waiting for job from submission ${submissionId}...`);
  const startTime = Date.now();
  
  while ((Date.now() - startTime) / 1000 < maxWaitSeconds) {
    const response = await fetch(`${ASTROMETRY_API_URL}/submissions/${submissionId}`);
    const data: JobStatus = await response.json();
    
    console.log("Submission status:", data);
    
    if (data.jobs && data.jobs.length > 0) {
      const jobId = data.jobs[0];
      if (jobId !== null) {
        return jobId;
      }
    }
    
    // Wait 3 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  return null;
}

async function getJobResult(jobId: number, maxWaitSeconds: number = 120): Promise<JobResult | null> {
  console.log(`Getting result for job ${jobId}...`);
  const startTime = Date.now();
  
  while ((Date.now() - startTime) / 1000 < maxWaitSeconds) {
    const response = await fetch(`${ASTROMETRY_API_URL}/jobs/${jobId}/info`);
    const data: JobResult = await response.json();
    
    console.log("Job status:", data.status);
    
    if (data.status === "success") {
      return data;
    } else if (data.status === "failure") {
      return null;
    }
    
    // Wait 3 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    const ASTROMETRY_NET_API_KEY = Deno.env.get("ASTROMETRY_NET_API_KEY");
    if (!ASTROMETRY_NET_API_KEY) {
      throw new Error("ASTROMETRY_NET_API_KEY is not configured");
    }

    console.log("Starting plate solve process...");

    // Step 1: Login
    const session = await login(ASTROMETRY_NET_API_KEY);

    // Step 2: Submit image
    const submissionId = await submitImage(session, imageBase64);
    console.log("Submission ID:", submissionId);

    // Step 3: Wait for job to be created
    const jobId = await waitForJob(submissionId, 60);
    if (!jobId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Timeout waiting for plate solve job to start. The image may not contain enough stars." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Wait for job result
    const result = await getJobResult(jobId, 120);
    if (!result) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Plate solve failed. The star pattern could not be matched against the catalog." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Plate solve successful:", result);

    return new Response(
      JSON.stringify({
        success: true,
        calibration: result.calibration,
        objectsInField: result.objects_in_field || result.tags || [],
        machineTags: result.machine_tags || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("plate-solve error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
