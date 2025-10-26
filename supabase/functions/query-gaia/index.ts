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
    const { objectName, ra, dec, radius = 0.5, maxMag = 19, minParallax = 0.1 } = await req.json();

    // If object name provided, resolve coordinates first
    let raCenter = ra;
    let decCenter = dec;

    if (objectName && !ra && !dec) {
      // Query Simbad to resolve object name to coordinates
      const simbadUrl = `https://simbad.u-strasbg.fr/simbad/sim-id?output.format=votable&Ident=${encodeURIComponent(objectName)}`;
      const simbadResponse = await fetch(simbadUrl);
      
      if (!simbadResponse.ok) {
        throw new Error("Failed to resolve object name");
      }

      const simbadText = await simbadResponse.text();
      
      // Parse VOTable XML to extract RA/Dec
      const raMatch = simbadText.match(/<TD>([0-9.]+)<\/TD>.*?<TD>([0-9.+-]+)<\/TD>/);
      if (raMatch) {
        raCenter = parseFloat(raMatch[1]);
        decCenter = parseFloat(raMatch[2]);
      } else {
        throw new Error("Could not parse coordinates from Simbad");
      }
    }

    if (!raCenter || !decCenter) {
      throw new Error("RA and Dec coordinates are required");
    }

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
      console.error("Gaia query failed:", errorText);
      throw new Error("Gaia query failed");
    }

    const gaiaData = await gaiaResponse.json();

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
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
