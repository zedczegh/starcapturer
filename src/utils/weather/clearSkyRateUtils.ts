
/**
 * Get regional pattern information for a specific location
 */
function getRegionalPattern(latitude?: number, longitude?: number, language: string = 'en'): string | null {
  if (!latitude || !longitude) return null;
  
  // Check for special regions with unique patterns
  
  // Tibetan plateau
  if (latitude >= 28 && latitude <= 36 && longitude >= 78 && longitude <= 92) {
    return language === 'zh' ? 
      '高原地区: 春季风沙多，秋冬晴朗日多，观测条件极佳' : 
      'Plateau region: Dusty in spring, clear days in autumn/winter, excellent viewing conditions';
  }
  
  // Tropical monsoon regions
  if (isTropicalMonsoonRegion(latitude, longitude)) {
    return language === 'zh' ? 
      '季风地区: 干季(冬春)观测条件较好，雨季(夏秋)多阴雨' : 
      'Monsoon region: Dry season (winter/spring) offers better viewing than wet season (summer/fall)';
  }
  
  // Mediterranean climate
  if (isMediterraneanRegion(latitude, longitude)) {
    return language === 'zh' ? 
      '地中海气候: 夏季晴朗干燥，冬季多雨' : 
      'Mediterranean climate: Clear, dry summers with rainy winters';
  }
  
  // Desert regions
  if (isDesertRegion(latitude, longitude)) {
    return language === 'zh' ? 
      '沙漠地区: 全年晴朗日多，但春季尘暴可能影响观测' : 
      'Desert region: Year-round clear skies, but spring dust storms may affect viewing';
  }
  
  return null;
}
