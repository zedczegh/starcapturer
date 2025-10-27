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
    console.log('Query-gaia function called');
    const { objectName, ra, dec, radius = 0.5, maxMag = 19, minParallax = 0.1 } = await req.json();
    console.log('Request params:', { objectName, ra, dec, radius, maxMag, minParallax });

    // If object name provided, resolve coordinates first
    let raCenter = ra;
    let decCenter = dec;

    if (objectName && !ra && !dec) {
      console.log(`Resolving object name: ${objectName}`);
      // Query Simbad to resolve object name to coordinates
      const simbadUrl = `https://simbad.u-strasbg.fr/simbad/sim-id?output.format=votable&Ident=${encodeURIComponent(objectName)}`;
      const simbadResponse = await fetch(simbadUrl);
      
      if (!simbadResponse.ok) {
        console.error('Simbad query failed:', simbadResponse.status);
        throw new Error(`Failed to resolve object name "${objectName}". Object not found in Simbad database.`);
      }

      const simbadText = await simbadResponse.text();
      
      // Parse VOTable XML to extract RA/Dec
      const raMatch = simbadText.match(/<TD>([0-9.]+)<\/TD>.*?<TD>([0-9.+-]+)<\/TD>/);
      if (raMatch) {
        raCenter = parseFloat(raMatch[1]);
        decCenter = parseFloat(raMatch[2]);
        console.log(`Resolved "${objectName}" to RA=${raCenter}, Dec=${decCenter}`);
      } else {
        console.error('Could not parse Simbad response');
        throw new Error(`Could not find coordinates for "${objectName}". Please check the object name or provide RA/Dec directly.`);
      }
    }

    if (!raCenter || !decCenter) {
      throw new Error("RA and Dec coordinates are required. Please enter an object name or coordinates.");
    }

    console.log(`Querying Gaia DR3 for RA=${raCenter}, Dec=${decCenter}, radius=${radius}`);

    // Query Gaia DR3
    const query = `
      SELECT TOP 10000 
        source_id, ra, dec, parallax, parallax_over_error,
        phot_g_mean_mag AS g_mag,
        phot_bp_mean_mag - phot_rp_mean_mag AS bp_rp
      FROM gaiadr3.gaia_source
      WHERE 1=CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', ${raCenter}, ${decCenter}, ${radius}))
        AND parallax > ${minParallax}
        AND phot_g_mean_mag < ${maxMag}
        AND parallax_over_error > 5
      ORDER BY parallax DESC
    `;

    const gaiaUrl = "https://gea.esac.esa.int/tap-server/tap/sync";
    const formData = new URLSearchParams({
      REQUEST: "doQuery",
      LANG: "ADQL",
      FORMAT: "json",
      QUERY: query,
    });

    const gaiaResponse = await fetch(gaiaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!gaiaResponse.ok) {
      const errorText = await gaiaResponse.text();
      console.error("Gaia query failed:", gaiaResponse.status, errorText);
      throw new Error(`Gaia database query failed. Please try again later.`);
    }

    const gaiaData = await gaiaResponse.json();
    
    if (!gaiaData.data || gaiaData.data.length === 0) {
      console.log('No stars found in Gaia query');
      return new Response(
        JSON.stringify({
          stars: [],
          center: { ra: raCenter, dec: decCenter },
          count: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${gaiaData.data.length} stars in Gaia`);

    // Process results
    const stars = gaiaData.data.map((row: any[]) => {
      const parallax = Math.max(row[3], minParallax);
      const distance = 1000.0 / parallax; // parsecs
      const bpRp = row[6] || 0;
      
      // Simple color mapping from BP-RP
      const colorIndex = Math.max(0, Math.min(1, (bpRp - 0.5) / 2));
      const colorR = colorIndex > 0.5 ? 1 : 0.5 + colorIndex;
      const colorG = 1;
      const colorB = colorIndex < 0.5 ? 1 : 1 - (colorIndex - 0.5) * 2;

      return {
        sourceId: row[0],
        ra: row[1],
        dec: row[2],
        parallax: row[3],
        gMag: row[5],
        bpRp: row[6],
        distance,
        color: {
          r: colorR,
          g: colorG,
          b: colorB,
        },
      };
    });

    console.log(`Successfully processed ${stars.length} stars`);

    return new Response(
      JSON.stringify({
        stars,
        center: { ra: raCenter, dec: decCenter },
        count: stars.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in query-gaia function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
