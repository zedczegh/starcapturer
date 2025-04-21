
import { supabase } from "@/integrations/supabase/client";

/**
 * Logs a SIQS calculation entry to Supabase.
 * @param params
 *   latitude: number,
 *   longitude: number,
 *   locationName: string,
 *   siqsScore: number,
 *   astroNightCloudCover: number | null,
 *   additionalMetadata?: Record<string, any>
 */
export async function logSiqsCalculation({
  latitude,
  longitude,
  locationName,
  siqsScore,
  astroNightCloudCover,
  additionalMetadata,
  userId
}: {
  latitude: number,
  longitude: number,
  locationName: string,
  siqsScore: number,
  astroNightCloudCover: number | null,
  additionalMetadata?: Record<string, any>,
  userId?: string // for future, currently optional
}) {
  try {
    const { error } = await supabase
      .from("siqs_calculation_entries")
      .insert([
        {
          latitude,
          longitude,
          location_name: locationName,
          siqs_score: siqsScore,
          astro_night_cloud_cover: astroNightCloudCover,
          additional_metadata: additionalMetadata || null,
          user_id: userId || null,
        },
      ]);

    if (error) {
      console.warn("Failed to log SIQS calculation:", error);
    }
  } catch (e) {
    console.error("Unexpected error logging SIQS calculation:", e);
  }
}
