import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SesameResult {
  name: string;
  ra: number;
  dec: number;
  objectType?: string;
  aliases?: string[];
  distance?: {
    value: number;
    unit: string;
    source: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const encodedQuery = encodeURIComponent(query.trim());
    
    // Query Sesame name resolver (XML format for better parsing)
    const sesameUrl = `https://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-oxp/SNV?${encodedQuery}`;
    
    console.log(`Querying Sesame: ${sesameUrl}`);
    
    const response = await fetch(sesameUrl, {
      headers: {
        "Accept": "application/xml",
        "User-Agent": "SIQS-Stereoscope/1.0"
      }
    });

    if (!response.ok) {
      console.error(`Sesame error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: "Failed to query SIMBAD database" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const xmlText = await response.text();
    console.log("Sesame response:", xmlText.substring(0, 500));

    // Parse the XML response
    const result = parseSesameXML(xmlText, query);
    
    if (!result) {
      return new Response(
        JSON.stringify({ error: "Object not found in SIMBAD database", query }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to get distance from SIMBAD if not in Sesame response
    if (!result.distance) {
      const distanceInfo = await fetchSimbadDistance(query);
      if (distanceInfo) {
        result.distance = distanceInfo;
      }
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("search-target error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseSesameXML(xml: string, originalQuery: string): SesameResult | null {
  try {
    // Extract coordinates using regex (XML parsing in Deno is complex)
    const jradegMatch = xml.match(/<jradeg>([^<]+)<\/jradeg>/);
    const jdedegMatch = xml.match(/<jdedeg>([^<]+)<\/jdedeg>/);
    
    if (!jradegMatch || !jdedegMatch) {
      // Try alternative format
      const raMatch = xml.match(/<d:RA[^>]*>([^<]+)<\/d:RA>/i) || xml.match(/RA\s*[:=]\s*([0-9.+-]+)/);
      const decMatch = xml.match(/<d:DE[^>]*>([^<]+)<\/d:DE>/i) || xml.match(/DE[C]?\s*[:=]\s*([0-9.+-]+)/);
      
      if (!raMatch || !decMatch) {
        console.log("Could not extract coordinates from response");
        return null;
      }
    }
    
    const ra = parseFloat(jradegMatch?.[1] || "0");
    const dec = parseFloat(jdedegMatch?.[1] || "0");
    
    if (isNaN(ra) || isNaN(dec)) {
      return null;
    }

    // Extract object name
    const onameMatch = xml.match(/<oname>([^<]+)<\/oname>/);
    const name = onameMatch ? onameMatch[1].trim() : originalQuery;

    // Extract object type
    const otypeMatch = xml.match(/<otype>([^<]+)<\/otype>/);
    const objectType = otypeMatch ? otypeMatch[1].trim() : undefined;

    // Extract aliases
    const aliasMatches = xml.matchAll(/<alias>([^<]+)<\/alias>/g);
    const aliases: string[] = [];
    for (const match of aliasMatches) {
      aliases.push(match[1].trim());
    }

    return {
      name,
      ra,
      dec,
      objectType,
      aliases: aliases.length > 0 ? aliases : undefined,
    };
  } catch (e) {
    console.error("XML parsing error:", e);
    return null;
  }
}

async function fetchSimbadDistance(objectName: string): Promise<{ value: number; unit: string; source: string } | null> {
  try {
    // Use SIMBAD TAP query for distance
    const query = `SELECT oid, main_id, dist, dist_unit, dist_bibcode 
                   FROM basic JOIN ident ON oid = ident.oidref 
                   WHERE id = '${objectName.replace(/'/g, "''")}' 
                   AND dist IS NOT NULL`;
    
    const tapUrl = `https://simbad.u-strasbg.fr/simbad/sim-tap/sync?request=doQuery&lang=ADQL&format=json&query=${encodeURIComponent(query)}`;
    
    const response = await fetch(tapUrl, {
      headers: { "User-Agent": "SIQS-Stereoscope/1.0" }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const row = data.data[0];
      const distValue = row[2]; // dist column
      const distUnit = row[3] || "pc"; // dist_unit column
      
      if (distValue) {
        // Convert to light years if in parsecs
        let lightYears = distValue;
        if (distUnit === "pc" || distUnit === "parsec") {
          lightYears = distValue * 3.26156;
        } else if (distUnit === "kpc") {
          lightYears = distValue * 3261.56;
        } else if (distUnit === "Mpc") {
          lightYears = distValue * 3261560;
        }
        
        return {
          value: Math.round(lightYears),
          unit: "ly",
          source: "SIMBAD"
        };
      }
    }
    
    return null;
  } catch (e) {
    console.error("SIMBAD distance query error:", e);
    return null;
  }
}
