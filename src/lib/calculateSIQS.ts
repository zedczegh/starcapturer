// SIQS = (0.35 × CC) + (0.25 × B) + (0.15 × S) + (0.1 × W) + (0.05 × H) + (0.1 × M)

type SIQSInput = {
  cloudCover: number; // percentage 0-100
  bortleScale: number; // 1-9
  seeingConditions: number; // arcseconds, typically 1-5
  windSpeed: number; // mph
  humidity: number; // percentage 0-100
  moonPhase?: number; // 0-1 (0 = new moon, 0.5 = half moon, 1 = full moon)
};

type SIQSResult = {
  score: number;
  cloudCoverScore: number;
  bortleScore: number;
  seeingScore: number;
  windScore: number;
  humidityScore: number;
  moonPhaseScore: number;
  isViable: boolean;
  factors: {
    name: string;
    score: number;
    description: string;
  }[];
  idealFor: string;
  recommendedTargets?: string[];
};

export function calculateSIQS(input: SIQSInput): SIQSResult {
  const { cloudCover, bortleScale, seeingConditions, windSpeed, humidity, moonPhase = 0.5 } = input;
  
  // Ensure the Bortle scale value is within valid range
  const validBortleScale = Math.max(1, Math.min(9, bortleScale));
  
  // Check cloud cover threshold first (≤ 40% is viable)
  const isViable = cloudCover <= 40;
  
  // If not viable, return early with score of 0 and factors
  if (!isViable) {
    return {
      score: 0,
      cloudCoverScore: 0,
      bortleScore: 0,
      seeingScore: 0,
      windScore: 0,
      humidityScore: 0,
      moonPhaseScore: 0,
      isViable: false,
      factors: [
        {
          name: "Cloud Cover",
          score: 0,
          description: "Cloud cover exceeds 40%. Not suitable for imaging."
        }
      ],
      idealFor: "Not suitable for imaging",
      qualitativeFeedback: "Cloud cover exceeds 40%. Not recommended for astrophotography."
    };
  }
  
  // Calculate individual factor scores
  // Cloud Cover: 10 (0% clouds) to 0 (>50% clouds)
  const cloudCoverScore = Math.max(0, 10 - (cloudCover / 60) * 10) * 10;
  
  // Bortle Scale: 10 (Bortle 1) to 0 (Bortle 9)
  const bortleScore = Math.max(0, 10 - ((validBortleScale - 1) * (10 / 8))) * 10;
  
  // Seeing Conditions: 10 (<1 arcsecond) to 0 (>3 arcseconds)
  const seeingScore = Math.max(0, 10 - ((seeingConditions - 1) * 5)) * 10;
  
  // Wind Gusts: 10 (<5 mph) to 0 (>20 mph)
  const windScore = Math.max(0, 10 - ((Math.max(5, windSpeed) - 5) * (10 / 15))) * 10;
  
  // Humidity/Dew Risk: 10 (low risk) to 0 (high risk)
  const humidityScore = Math.max(0, 10 - (humidity / 10)) * 10;
  
  // Moon Phase: 10 (new moon) to 0 (full moon)
  const moonPhaseScore = Math.max(0, 10 - (moonPhase * 10)) * 10;
  
  // Calculate final SIQS with weights
  const siqs = (
    (0.35 * cloudCoverScore) +
    (0.25 * bortleScore) +
    (0.15 * seeingScore) +
    (0.1 * windScore) +
    (0.05 * humidityScore) +
    (0.1 * moonPhaseScore)
  ) / 10;
  
  // Round to 1 decimal place
  const score = Math.round(siqs * 10) / 10;
  
  // Create factors array with descriptions
  const factors = [
    {
      name: "Cloud Cover",
      score: cloudCoverScore,
      description: `${cloudCover}% cloud coverage. ${cloudCover < 20 ? "Excellent" : cloudCover < 40 ? "Acceptable" : "Poor"} conditions.`
    },
    {
      name: "Light Pollution",
      score: bortleScore,
      description: `Bortle scale ${validBortleScale}/9. ${validBortleScale <= 4 ? "Dark sky" : validBortleScale <= 6 ? "Moderate light pollution" : "Significant light pollution"}.`
    },
    {
      name: "Seeing Conditions",
      score: seeingScore,
      description: `${seeingConditions} arcseconds. ${seeingConditions <= 2 ? "Good" : "Poor"} atmospheric stability.`
    },
    {
      name: "Wind Speed",
      score: windScore,
      description: `${windSpeed} mph winds. ${windSpeed < 10 ? "Stable" : windSpeed < 15 ? "Moderate" : "Unstable"} conditions.`
    },
    {
      name: "Humidity",
      score: humidityScore,
      description: `${humidity}% humidity. ${humidity < 60 ? "Low" : humidity < 80 ? "Moderate" : "High"} dew risk.`
    },
    {
      name: "Moon Phase",
      score: moonPhaseScore,
      description: `${Math.round(moonPhase * 100)}% illumination. ${moonPhase < 0.3 ? "Dark sky" : moonPhase < 0.7 ? "Moderate moonlight" : "Bright moonlight"}.`
    }
  ];

  // Determine ideal imaging type based on Bortle scale and moon phase
  let idealFor = "";
  let recommendedTargets: string[] = [];
  
  if (validBortleScale >= 7) {
    // High light pollution area
    idealFor = "Best for planetary and lunar imaging due to high light pollution";
    recommendedTargets = [...getCurrentVisiblePlanets(), "Moon"];
  } else if (moonPhase > 0.7) {
    // High moon phase - better for planetary
    idealFor = "Ideal for planetary imaging; limited for deep sky objects";
    recommendedTargets = getCurrentVisiblePlanets();
  } else if (moonPhase < 0.3 && validBortleScale <= 5) {
    // Low moon phase, decent dark skies - good for deep sky
    idealFor = "Excellent for deep sky imaging";
    recommendedTargets = getSeasonalDeepSkyObjects();
  } else {
    // Mixed conditions
    idealFor = "Suitable for both planetary and brighter deep sky objects";
    recommendedTargets = [...getCurrentVisiblePlanets(), ...getBrightDeepSkyObjects()];
  }
  
  // Generate qualitative feedback based on Bortle scale
  let qualitativeFeedback = "";
  if (validBortleScale >= 8) {
    qualitativeFeedback = "Very high light pollution. Limit imaging to planets, moon, and brightest stars.";
  } else if (validBortleScale >= 6) {
    qualitativeFeedback = "Significant light pollution. Consider narrowband filters for deep sky imaging.";
  } else if (score >= 8.5) {
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
    moonPhaseScore,
    isViable: true,
    factors,
    qualitativeFeedback,
    idealFor,
    recommendedTargets
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

// Helper function to get currently visible planets based on date
function getCurrentVisiblePlanets(): string[] {
  const month = new Date().getMonth(); // 0-11
  
  // Simplified visible planets by month - this would be more accurate with real astronomy calculations
  if (month >= 0 && month <= 3) { // Jan-Apr
    return ["Mars", "Jupiter", "Saturn"];
  } else if (month >= 4 && month <= 7) { // May-Aug
    return ["Jupiter", "Saturn", "Venus"];
  } else { // Sep-Dec
    return ["Venus", "Mars", "Jupiter"];
  }
}

// Helper function to get seasonal deep sky objects
function getSeasonalDeepSkyObjects(): string[] {
  const month = new Date().getMonth(); // 0-11
  
  // Simplified visible deep sky objects by season
  if (month >= 0 && month <= 2) { // Winter
    return ["Orion Nebula", "Pleiades", "Andromeda Galaxy"];
  } else if (month >= 3 && month <= 5) { // Spring
    return ["Whirlpool Galaxy", "Leo Triplet", "Beehive Cluster"];
  } else if (month >= 6 && month <= 8) { // Summer
    return ["Lagoon Nebula", "Eagle Nebula", "Milky Way Core"];
  } else { // Fall
    return ["Andromeda Galaxy", "Triangulum Galaxy", "Double Cluster"];
  }
}

// Helper function to get bright deep sky objects that work in less than ideal conditions
function getBrightDeepSkyObjects(): string[] {
  return ["Pleiades", "Orion Nebula", "Andromeda Galaxy", "Double Cluster", "Beehive Cluster"];
}
