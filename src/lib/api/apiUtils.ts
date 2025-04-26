
/**
 * API utilities for making requests to external services
 */

// Define common API endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.example.com';

/**
 * Fetch clear sky rate data from API
 */
export async function fetchClearSkyRate(
  latitude: number, 
  longitude: number, 
  includeHistorical: boolean = true
): Promise<{
  annualRate: number;
  monthlyRates: Record<string, number>;
  clearestMonths: string[];
  confidence: number;
  dataSource: string;
}> {
  try {
    // In a real implementation, this would call an API
    // For now, returning mock data
    
    // Generate some realistic clear sky rates based on latitude
    const isNorthern = latitude >= 0;
    const baseRate = 50 + (Math.random() * 30 - 15);
    
    const monthlyRates: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Northern and Southern hemispheres have different seasonal patterns
    const seasonalPatterns = isNorthern 
      ? [5, 0, 10, 15, 20, 25, 25, 15, 10, 5, -5, -10] // Northern
      : [-10, -5, 0, 5, 10, 15, 20, 25, 15, 5, 0, -5]; // Southern
    
    // Generate monthly rates
    months.forEach((month, idx) => {
      const seasonalAdjustment = seasonalPatterns[idx];
      monthlyRates[month] = Math.min(100, Math.max(0, 
        Math.round(baseRate + seasonalAdjustment + (Math.random() * 10 - 5))
      ));
    });
    
    // Determine clearest months (top 3)
    const sortedMonths = [...months].sort(
      (a, b) => monthlyRates[b] - monthlyRates[a]
    );
    const clearestMonths = sortedMonths.slice(0, 3);
    
    return {
      annualRate: Math.round(baseRate),
      monthlyRates,
      clearestMonths,
      confidence: 0.75 + (Math.random() * 0.2),
      dataSource: 'Simulated Data'
    };
  } catch (error) {
    console.error("Error fetching clear sky rate:", error);
    throw error;
  }
}
