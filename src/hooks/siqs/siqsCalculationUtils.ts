
/**
 * Utilities for SIQS calculation, formatting, and display
 */

/**
 * Format SIQS score for display with appropriate precision
 */
export function formatSIQSScoreForDisplay(score: number | undefined | null): string {
  if (score === undefined || score === null) return "--";
  return score.toFixed(1);
}

/**
 * Get color class for SIQS score
 */
export function getSIQSColorClass(score: number | undefined | null): string {
  if (score === undefined || score === null) return "text-muted-foreground";
  
  if (score >= 8) return "text-emerald-400";
  if (score >= 6) return "text-green-400";
  if (score >= 4) return "text-yellow-400";
  if (score >= 2) return "text-orange-400";
  return "text-red-400";
}

/**
 * Get description for SIQS score
 */
export function getSIQSDescription(score: number | undefined | null, language: string = 'en'): string {
  if (score === undefined || score === null) return language === 'en' ? "Unknown" : "未知";
  
  if (language === 'en') {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Very Good";
    if (score >= 4) return "Good";
    if (score >= 2) return "Fair";
    return "Poor";
  } else {
    if (score >= 8) return "极佳";
    if (score >= 6) return "很好";
    if (score >= 4) return "良好";
    if (score >= 2) return "一般";
    return "较差";
  }
}

/**
 * Get SIQS progress bar color class
 */
export function getSIQSProgressColor(score: number | undefined | null): string {
  if (score === undefined || score === null) return "bg-muted";
  
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-green-500";
  if (score >= 4) return "bg-yellow-500";
  if (score >= 2) return "bg-orange-500";
  return "bg-red-500";
}

/**
 * Get SIQS background gradient class
 */
export function getSIQSBackgroundClass(score: number | undefined | null): string {
  if (score === undefined || score === null) return "bg-cosmic-900/50";
  
  if (score >= 8) return "bg-gradient-to-r from-emerald-900/30 to-cosmic-900/50 border-emerald-800/30";
  if (score >= 6) return "bg-gradient-to-r from-green-900/30 to-cosmic-900/50 border-green-800/30";
  if (score >= 4) return "bg-gradient-to-r from-yellow-900/30 to-cosmic-900/50 border-yellow-800/30";
  if (score >= 2) return "bg-gradient-to-r from-orange-900/30 to-cosmic-900/50 border-orange-800/30";
  return "bg-gradient-to-r from-red-900/30 to-cosmic-900/50 border-red-800/30";
}

/**
 * Normalize SIQS score to ensure it's on a 0-10 scale
 */
export function normalizeScore(score: number): number {
  // Handle scores that might be on different scales
  if (score > 10) {
    return Math.min(10, score / 10);
  }
  
  // Ensure score is between 0 and 10
  return Math.max(0, Math.min(10, score));
}

/**
 * Calculate SIQS with weather data
 */
export async function calculateSIQSWithWeatherData(
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number,
  forecastData: any
): Promise<any> {
  try {
    // Default factors
    const factors = [
      {
        name: "Light Pollution",
        score: Math.max(0, 10 - bortleScale),
        description: `Bortle scale ${bortleScale} indicates moderate light pollution`
      },
      {
        name: "Seeing Conditions",
        score: Math.max(0, 6 - seeingConditions) * 2,
        description: `Seeing rated at ${seeingConditions}/5`
      }
    ];
    
    // Cloud Cover factor
    const cloudCover = weatherData.cloudCover;
    if (cloudCover > 80) {
      return {
        score: 0,
        isViable: false,
        factors: [
          {
            name: "Cloud Cover",
            score: 0,
            description: `${cloudCover}% cloud cover makes imaging impossible`
          }
        ]
      };
    }
    
    factors.push({
      name: "Cloud Cover",
      score: Math.max(0, 10 - (cloudCover / 10)),
      description: `${cloudCover}% cloud cover affects visibility`
    });
    
    // Moon Phase factor
    const moonFactor = {
      name: "Moon Phase",
      score: Math.max(0, 10 - (moonPhase * 10)),
      description: moonPhase < 0.2 ? "New moon provides dark skies" : 
                  moonPhase > 0.8 ? "Full moon brightens the sky significantly" :
                  `Moon phase at ${Math.round(moonPhase * 100)}% illumination`
    };
    factors.push(moonFactor);
    
    // Calculate overall score
    let totalScore = factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length;
    
    // Apply humidity penalty if high
    if (weatherData.humidity > 80) {
      totalScore *= 0.8;
      factors.push({
        name: "Humidity",
        score: Math.max(0, 10 - (weatherData.humidity - 60) / 4),
        description: `High humidity (${weatherData.humidity}%) may cause dew problems`
      });
    }
    
    // Apply wind penalty if high
    if (weatherData.windSpeed > 25) {
      totalScore *= 0.7;
      factors.push({
        name: "Wind",
        score: Math.max(0, 10 - (weatherData.windSpeed - 5) / 2),
        description: `Strong winds (${weatherData.windSpeed} m/s) affect stability`
      });
    }
    
    return {
      score: totalScore,
      isViable: totalScore > 3,
      factors
    };
  } catch (error) {
    console.error("Error calculating SIQS with weather data:", error);
    return {
      score: 3, // Moderate default
      isViable: true,
      factors: [{ name: "Default", score: 3, description: "Calculation used default values" }]
    };
  }
}
