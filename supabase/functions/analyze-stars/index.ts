import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, analysisType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (analysisType === "star-analysis") {
      systemPrompt = `You are an expert astrophysicist and astronomical image analyst with encyclopedic knowledge of the NGC, IC, Messier, and other deep sky catalogs. Analyze astronomy images to:
1. IDENTIFY the specific celestial object(s) by their catalog names
2. Provide celestial coordinates for use in planetarium software like Stellarium
3. Estimate depth/distance for stereoscopic rendering

Your response MUST be valid JSON with this exact structure:
{
  "summary": "Brief description of what's in the image",
  "identification": {
    "primaryObject": {
      "catalogName": "e.g. M42, NGC 7000, IC 1396",
      "commonName": "e.g. Orion Nebula, North America Nebula",
      "constellation": "e.g. Orion, Cygnus",
      "objectType": "emission nebula|reflection nebula|planetary nebula|galaxy|star cluster|supernova remnant|other",
      "coordinates": {
        "ra": "Right Ascension in format HH:MM:SS or decimal hours",
        "dec": "Declination in format +/-DD:MM:SS or decimal degrees",
        "raDecimal": 0.0,
        "decDecimal": 0.0
      },
      "distanceLightYears": "estimated distance in light years (number or range)",
      "apparentMagnitude": "visual magnitude if known",
      "angularSize": "approximate angular size in arcminutes"
    },
    "secondaryObjects": [
      {
        "catalogName": "any other identifiable objects in the field",
        "commonName": "common name if any",
        "relationship": "e.g. foreground star, nearby nebula, part of same complex"
      }
    ],
    "confidence": "high|medium|low",
    "identificationNotes": "Any notes about the identification, uncertainties, or distinguishing features used"
  },
  "objects": [
    {
      "type": "star|galaxy|nebula|planetary_nebula|cluster|other",
      "name": "Common name if identifiable",
      "estimatedDistance": "near|medium|far|very_far",
      "depthLayer": 1-10,
      "brightness": "bright|medium|dim",
      "color": "blue|white|yellow|orange|red|mixed",
      "notes": "Any special characteristics"
    }
  ],
  "stereoscopicRecommendations": {
    "suggestedMaxShift": 15-50,
    "depthContrast": "low|medium|high",
    "primaryForeground": "Description of closest objects",
    "primaryBackground": "Description of farthest objects",
    "processingTips": ["tip1", "tip2"]
  },
  "objectClassification": {
    "hasNebula": true/false,
    "hasGalaxy": true/false,
    "hasStarCluster": true/false,
    "dominantType": "nebula|galaxy|starfield|planetary|mixed"
  }
}`;

      userPrompt = "Analyze this astronomical image. FIRST, identify the specific deep sky object(s) shown - look for recognizable nebulae, galaxies, or star clusters from major catalogs (Messier, NGC, IC, etc). Provide the object's catalog name, common name, constellation, and precise celestial coordinates (RA/Dec) so users can find it in Stellarium. THEN analyze depth relationships for stereoscopic 3D rendering.";
    } else if (analysisType === "depth-enhancement") {
      systemPrompt = `You are an expert in astronomical image processing and stereoscopic rendering. Analyze the image to suggest optimal depth parameters for creating realistic 3D stereoscopic pairs.

Your response MUST be valid JSON with this exact structure:
{
  "depthAnalysis": {
    "foregroundElements": ["list of objects that should appear closest"],
    "midgroundElements": ["list of objects at medium distance"],
    "backgroundElements": ["list of objects that should appear farthest"]
  },
  "parameters": {
    "starDisplacement": 5-30,
    "nebulaDisplacement": 10-50,
    "borderSize": 100-500,
    "stereoSpacing": 400-800
  },
  "tips": ["processing tip 1", "processing tip 2"]
}`;

      userPrompt = "Analyze this astronomical image and suggest optimal stereoscopic rendering parameters. Consider the depth relationships between stars, nebulae, and other objects.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Try to parse JSON from the response
    let analysisResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Return raw content if JSON parsing fails
      analysisResult = { rawAnalysis: content };
    }

    return new Response(JSON.stringify({ analysis: analysisResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("analyze-stars error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
