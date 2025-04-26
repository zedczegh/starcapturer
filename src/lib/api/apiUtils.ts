
/**
 * API utility functions for fetching and processing data
 */

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
    // In a real implementation, this would fetch from an actual API
    // For now, simulate a response based on coordinates
    
    // Generate a stable random value based on coordinates
    const seed = Math.abs(Math.sin(latitude * longitude) * 10000);
    const baseRate = 40 + Math.floor((seed % 50)); // 40-90% range
    
    const monthlyRates: Record<string, number> = {
      'Jan': Math.min(100, Math.max(0, baseRate - 5 + Math.floor(seed % 11))),
      'Feb': Math.min(100, Math.max(0, baseRate - 3 + Math.floor((seed * 2) % 11))),
      'Mar': Math.min(100, Math.max(0, baseRate + 0 + Math.floor((seed * 3) % 11))),
      'Apr': Math.min(100, Math.max(0, baseRate + 3 + Math.floor((seed * 4) % 11))),
      'May': Math.min(100, Math.max(0, baseRate + 5 + Math.floor((seed * 5) % 11))),
      'Jun': Math.min(100, Math.max(0, baseRate + 8 + Math.floor((seed * 6) % 11))),
      'Jul': Math.min(100, Math.max(0, baseRate + 10 + Math.floor((seed * 7) % 11))),
      'Aug': Math.min(100, Math.max(0, baseRate + 7 + Math.floor((seed * 8) % 11))),
      'Sep': Math.min(100, Math.max(0, baseRate + 4 + Math.floor((seed * 9) % 11))),
      'Oct': Math.min(100, Math.max(0, baseRate + 0 + Math.floor((seed * 10) % 11))),
      'Nov': Math.min(100, Math.max(0, baseRate - 2 + Math.floor((seed * 11) % 11))),
      'Dec': Math.min(100, Math.max(0, baseRate - 4 + Math.floor((seed * 12) % 11)))
    };
    
    // Determine clearest months
    const sortedMonths = Object.entries(monthlyRates)
      .sort(([, rateA], [, rateB]) => rateB - rateA)
      .slice(0, 3)
      .map(([month]) => month);
    
    return {
      annualRate: baseRate,
      monthlyRates,
      clearestMonths: sortedMonths,
      confidence: 0.7,
      dataSource: 'Simulated API data'
    };
  } catch (error) {
    console.error("Error fetching clear sky rate:", error);
    throw new Error("Failed to fetch clear sky rate data");
  }
}
