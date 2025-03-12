
// SIQS = (0.4 × CC) + (0.25 × B) + (0.2 × S) + (0.1 × W) + (0.05 × H)

type SIQSInput = {
  cloudCover: number; // percentage 0-100
  bortleScale: number; // 1-9
  seeingConditions: number; // arcseconds, typically 1-5
  windSpeed: number; // mph
  humidity: number; // percentage 0-100
};

type SIQSResult = {
  score: number;
  cloudCoverScore: number;
  bortleScore: number;
  seeingScore: number;
  windScore: number;
  humidityScore: number;
  isViable: boolean;
  qualitativeFeedback: string;
};

export function calculateSIQS(input: SIQSInput): SIQSResult {
  const { cloudCover, bortleScale, seeingConditions, windSpeed, humidity } = input;
  
  // Check cloud cover threshold first (≤ 20% is viable)
  const isViable = cloudCover <= 20;
  
  // If not viable, return early with score of 0
  if (!isViable) {
    return {
      score: 0,
      cloudCoverScore: 0,
      bortleScore: 0,
      seeingScore: 0,
      windScore: 0,
      humidityScore: 0,
      isViable: false,
      qualitativeFeedback: "Cloud cover exceeds 20%. Not recommended for astrophotography."
    };
  }
  
  // Calculate individual factor scores
  // Cloud Cover: 10 (0% clouds) to 0 (>50% clouds)
  const cloudCoverScore = Math.max(0, 10 - (cloudCover / 50) * 10);
  
  // Bortle Scale: 10 (Bortle 1) to 0 (Bortle 9)
  const bortleScore = Math.max(0, 10 - ((bortleScale - 1) * (10 / 8)));
  
  // Seeing Conditions: 10 (<1 arcsecond) to 0 (>3 arcseconds)
  const seeingScore = Math.max(0, 10 - ((seeingConditions - 1) * 5));
  
  // Wind Gusts: 10 (<5 mph) to 0 (>20 mph)
  const windScore = Math.max(0, 10 - ((Math.max(5, windSpeed) - 5) * (10 / 15)));
  
  // Humidity/Dew Risk: 10 (low risk) to 0 (high risk)
  const humidityScore = Math.max(0, 10 - (humidity / 10));
  
  // Calculate final SIQS with weights
  const siqs = (
    (0.4 * cloudCoverScore) +
    (0.25 * bortleScore) +
    (0.2 * seeingScore) +
    (0.1 * windScore) +
    (0.05 * humidityScore)
  );
  
  // Round to 1 decimal place
  const score = Math.round(siqs * 10) / 10;
  
  // Generate qualitative feedback
  let qualitativeFeedback = "";
  if (score >= 8.5) {
    qualitativeFeedback = "Exceptional conditions for astrophotography!";
  } else if (score >= 7) {
    qualitativeFeedback = "Excellent imaging conditions.";
  } else if (score >= 5.5) {
    qualitativeFeedback = "Good conditions for astrophotography.";
  } else if (score >= 4) {
    qualitativeFeedback = "Acceptable conditions, but not ideal.";
  } else {
    qualitativeFeedback = "Poor conditions. Consider rescheduling.";
  }
  
  return {
    score,
    cloudCoverScore,
    bortleScore,
    seeingScore,
    windScore,
    humidityScore,
    isViable: true,
    qualitativeFeedback
  };
}

// Utility to convert SIQS to color
export function siqsToColor(score: number, isViable: boolean): string {
  if (!isViable) return "rgb(239, 68, 68)"; // Red for non-viable
  
  if (score >= 8.5) return "rgb(34, 197, 94)"; // Green
  if (score >= 7) return "rgb(132, 204, 22)"; // Lime green
  if (score >= 5.5) return "rgb(234, 179, 8)"; // Yellow
  if (score >= 4) return "rgb(249, 115, 22)"; // Orange
  return "rgb(239, 68, 68)"; // Red
}
