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
    const { imageBase64, analysisType, plateSolveContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    // Build context string from plate solve data
    let plateSolveInfo = "";
    if (plateSolveContext) {
      plateSolveInfo = `
PLATE SOLVE DATA (verified astrometric solution):
- Center coordinates: RA ${plateSolveContext.ra?.toFixed(4)}°, Dec ${plateSolveContext.dec?.toFixed(4)}°
- Field radius: ${plateSolveContext.fieldRadius?.toFixed(2)}°
- Pixel scale: ${plateSolveContext.pixelScale?.toFixed(2)} arcsec/pixel`;
      
      if (plateSolveContext.identifiedObject) {
        const obj = plateSolveContext.identifiedObject;
        plateSolveInfo += `
- PRIMARY IDENTIFIED OBJECT: ${obj.commonName || obj.name}
  - Catalog name: ${obj.name}
  - Object type: ${obj.type}${obj.distanceLY ? `
  - KNOWN DISTANCE: ${obj.distanceLY.toLocaleString()} light years` : ''}`;
      }
      
      if (plateSolveContext.objectsInField?.length > 0) {
        plateSolveInfo += `
- Other objects in field: ${plateSolveContext.objectsInField.slice(0, 10).join(', ')}`;
      }
    }

    if (analysisType === "star-analysis") {
      systemPrompt = `You are an expert astrophysicist and astronomical image analyst specializing in stereoscopic 3D rendering of deep sky objects.

CRITICAL SCIENTIFIC RULES FOR DISPLACEMENT DIRECTION:
The displacement direction determines whether objects appear to "pop out" (towards viewer) or "sink in" (away from viewer) in the stereoscopic image.

DISPLACEMENT DIRECTION RULES (based on astrophysics):
1. SINK IN (right displacement) - Objects that are BEHIND the star field:
   - Emission nebulae (H II regions): Gas clouds illuminated by embedded stars - they are diffuse background structures
   - Reflection nebulae: Dust clouds reflecting starlight - background structures
   - Galaxies: Extremely distant, should appear as deep background objects
   - Dark nebulae (absorption nebulae): Dense dust blocking light - background structures
   - Planetary nebulae shells: The outer shell appears behind foreground stars
   - Star-forming regions: The gas/dust complex is the backdrop

2. POP OUT (left displacement) - Objects that are IN FRONT or appear closer:
   - Supernova remnants (SNR): Expanding shells of gas moving TOWARDS us at high velocity - they are 3D expanding structures with parts moving toward viewer
   - Protoplanetary nebulae: Ejected material expanding outward
   - Nova shells: Recently ejected material
   - Cometary tails (if applicable): Material streaming toward observer
   - Central stars of planetary nebulae: Should pop out relative to the shell

${plateSolveContext ? `IMPORTANT: Use the plate solve data provided to give ACCURATE distance-based recommendations. The identified object's actual distance in light years should directly influence the suggestedMaxShift value:
- Objects < 500 ly: suggestedMaxShift 40-50
- Objects 500-1500 ly: suggestedMaxShift 25-40
- Objects 1500-3000 ly: suggestedMaxShift 15-25  
- Objects 3000-7000 ly: suggestedMaxShift 10-18
- Objects > 7000 ly or galaxies: suggestedMaxShift 5-12` : ''}

Your response MUST be valid JSON with this exact structure:
{
  "summary": "Brief description of what's in the image",
  "objects": [
    {
      "type": "star|galaxy|nebula|planetary_nebula|cluster|supernova_remnant|other",
      "name": "Common name if identifiable, otherwise descriptive name",
      "estimatedDistance": "near|medium|far|very_far",
      "depthLayer": 1-10 (1=closest, 10=farthest),
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
    "displacementDirection": "left|right (left=pop out for SNR/expanding objects, right=sink in for nebulae/galaxies)",
    "starsDisplacementDirection": "left|right (typically opposite of main object)",
    "scientificRationale": "Explain why this direction was chosen based on the object type",
    "processingTips": ["tip1", "tip2"]
  },
  "objectClassification": {
    "hasNebula": true/false,
    "hasGalaxy": true/false,
    "hasStarCluster": true/false,
    "hasSupernova": true/false,
    "dominantType": "nebula|galaxy|starfield|planetary|supernova_remnant|mixed"
  }
}`;

      userPrompt = plateSolveContext 
        ? `Analyze this astronomical image with the following verified plate solve data:
${plateSolveInfo}

Based on this astrometric data and the KNOWN distance of the primary object, provide optimized stereoscopic rendering recommendations. The suggestedMaxShift should be calibrated to the actual distance.`
        : "Analyze this astronomical image. Identify all visible celestial objects (stars, nebulae, galaxies, etc.) and estimate their relative distances for creating a stereoscopic 3D effect. Provide specific recommendations for depth layering.";
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
