
import { Language } from "@/contexts/LanguageContext";

/**
 * Check if moon is bright enough to affect deep sky imaging
 */
export function isMoonBright(moonPhase: string | number): boolean {
  if (typeof moonPhase === 'number') {
    return moonPhase > 0.5;
  }
  
  // If it's a string, check for brightness indicators
  return moonPhase.includes("Full") || 
         moonPhase.includes("Gibbous") || 
         moonPhase.includes("Quarter");
}

/**
 * Get recommended moon avoidance strategy based on language
 */
export function getMoonAvoidanceStrategy(language: Language): string {
  return language === 'en' 
    ? "Consider using a narrowband filter or focus on planetary photography instead."
    : "考虑使用窄带滤镜或改为进行行星摄影。";
}

/**
 * Get advice for specific seeing conditions
 */
export function getSeeingAdvice(score: number, language: Language): string {
  if (score < 40) {
    return language === 'en'
      ? "Very poor seeing conditions. Focus on wide-field targets or lunar/planetary imaging with short exposures."
      : "非常差的视宁度条件。专注于广角目标或使用短曝光进行月球/行星摄影。";
  }
  
  if (score < 60) {
    return language === 'en'
      ? "Poor atmospheric stability. Consider using shorter exposures or focusing on brighter targets."
      : "大气稳定性差。考虑使用较短的曝光时间或专注于较亮的目标。";
  }
  
  return language === 'en'
    ? "Average seeing conditions. Balance exposure times accordingly."
    : "一般视宁度条件。相应地平衡曝光时间。";
}

/**
 * Get advice for humidity levels
 */
export function getHumidityAdvice(humidity: number, language: Language): string {
  if (humidity > 85) {
    return language === 'en'
      ? "Very high humidity. Dew will likely form rapidly on optics. Use dew heaters and check equipment frequently."
      : "湿度非常高。露水可能会在光学设备上迅速形成。使用露水加热器并经常检查设备。";
  }
  
  if (humidity > 70) {
    return language === 'en'
      ? "High humidity increases risk of dew formation. Consider using dew heaters for your optics."
      : "高湿度增加了露水形成的风险。考虑为主镜使用加热带。";
  }
  
  return language === 'en'
    ? "Moderate humidity. Monitor equipment for potential dew formation."
    : "中等湿度。监控设备，留意可能的露水形成。";
}

/**
 * Get advice for light pollution levels
 */
export function getLightPollutionAdvice(bortleScale: number | null, language: Language): string {
  if (!bortleScale) {
    return language === 'en'
      ? "Light pollution level unknown. Consider using light pollution filters as a precaution."
      : "光污染水平未知。建议使用光污染滤镜作为预防措施。";
  }
  
  if (bortleScale >= 7) {
    return language === 'en'
      ? "Severe light pollution. Use narrowband filters for deep sky objects or focus on lunar/planetary targets."
      : "严重光污染。使用窄带滤镜观测深空天体或专注于月球/行星目标。";
  }
  
  if (bortleScale >= 5) {
    return language === 'en'
      ? "Significant light pollution. Consider using light pollution filters for deep sky objects."
      : "显著光污染。考虑使用光污染滤镜观测深空天体。";
  }
  
  return language === 'en'
    ? "Moderate light pollution. Some filters may improve contrast for certain targets."
    : "中等光污染。某些滤镜可能会提高特定目标的对比度。";
}

/**
 * Get extreme weather alerts based on conditions
 */
export function getExtremeWeatherAlerts(
  weatherCode: number | undefined, 
  windSpeed: number, 
  precipitation: number, 
  language: Language
): { message: string, severity: 'warning' | 'severe', icon: string } | null {
  // Check for severe weather codes
  if (weatherCode) {
    // Thunderstorms
    if ([95, 96, 99].includes(weatherCode)) {
      return {
        message: language === 'en' 
          ? "Thunderstorm detected. Equipment may be damaged by lightning. Avoid observation." 
          : "检测到雷暴。设备可能因闪电而损坏。避免观测。",
        severity: 'severe',
        icon: 'thunderstorm'
      };
    }
    
    // Sandstorms and heavy dust
    if ([6, 7, 8].includes(weatherCode)) {
      return {
        message: language === 'en' 
          ? "Dust/sand storm conditions. Equipment may be damaged. Avoid observation." 
          : "沙尘暴条件。设备可能受损。避免观测。",
        severity: 'severe',
        icon: 'wind'
      };
    }
    
    // Heavy snow
    if ([71, 73, 75, 77].includes(weatherCode)) {
      return {
        message: language === 'en' 
          ? "Heavy snow conditions. Protect equipment from moisture damage." 
          : "大雪条件。保护设备免受水分损害。",
        severity: 'warning',
        icon: 'snow'
      };
    }
    
    // Freezing rain
    if ([66, 67].includes(weatherCode)) {
      return {
        message: language === 'en' 
          ? "Freezing rain detected. Equipment may be damaged by ice formation." 
          : "检测到冻雨。设备可能因结冰而损坏。",
        severity: 'warning',
        icon: 'sleet'
      };
    }
  }
  
  // Check for extreme winds
  if (windSpeed > 60) {
    return {
      message: language === 'en' 
        ? "Dangerously high winds. Equipment stability compromised. Cancel observation." 
        : "危险的高风速。设备稳定性受损。建议取消观测。",
      severity: 'severe',
      icon: 'wind'
    };
  }
  
  // Check for heavy rain
  if (precipitation > 15) {
    return {
      message: language === 'en' 
        ? "Heavy rainfall detected. Protect equipment from water damage." 
        : "检测到大雨。保护设备免受水损伤。",
      severity: 'warning',
      icon: 'rain'
    };
  }
  
  return null;
}
