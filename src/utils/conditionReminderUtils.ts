
/**
 * Utility functions for generating astronomy-specific reminders
 * and warm reminders based on current conditions
 */

/**
 * Check if the moon is bright enough to significantly affect observations
 */
export function isMoonBright(moonPhase: number): boolean {
  // Moon is most disruptive between 0.75-1.0 and 0.0-0.25 (close to full)
  return moonPhase >= 0.75 || moonPhase <= 0.25;
}

/**
 * Get advice for dealing with moon brightness based on phase
 */
export function getMoonAvoidanceStrategy(language: string = 'en'): string {
  if (language === 'zh') {
    return "明亮的月光可能会干扰深空天体的观测。考虑观测与月亮相反方向的天体，或集中在行星和月球观测上。";
  } else {
    return "Bright moonlight may interfere with deep-sky observations. Consider observing objects in the opposite direction from the moon, or focus on planetary and lunar observations instead.";
  }
}

/**
 * Get advice based on seeing conditions
 */
export function getSeeingAdvice(seeingScore: number, language: string = 'en'): string {
  // Seeing score expected to be 0-100
  if (seeingScore < 30) {
    return language === 'en'
      ? "Poor atmospheric seeing conditions. Focus on wide-field observations rather than high-magnification planetary viewing."
      : "大气视宁度条件较差。专注于广角观测，而不是高倍率的行星观测。";
  } else if (seeingScore < 60) {
    return language === 'en'
      ? "Moderate seeing conditions. Planetary details may be somewhat blurred at high magnification."
      : "中等视宁度条件。行星细节在高倍率下可能会有些模糊。";
  } else {
    return language === 'en'
      ? "Good seeing conditions. Excellent for detailed planetary observations and high-magnification viewing."
      : "良好的视宁度条件。非常适合详细的行星观测和高倍率观测。";
  }
}

/**
 * Get advice based on humidity levels
 */
export function getHumidityAdvice(humidity: number, language: string = 'en'): string {
  if (humidity > 85) {
    return language === 'en'
      ? "Very high humidity. Watch for dew forming on optics and consider using a dew shield or heater."
      : "湿度非常高。注意光学元件上的露水形成，考虑使用防露罩或加热器。";
  } else if (humidity > 70) {
    return language === 'en'
      ? "High humidity may cause dew to form on optics. Keep lens caps on until ready to observe."
      : "高湿度可能导致光学元件上形成露水。准备好观测前请保持镜头盖盖好。";
  } else {
    return language === 'en'
      ? "Humidity levels are acceptable. Still, it's good practice to allow equipment to acclimate before observing."
      : "湿度水平可接受。不过，最好在观测前让设备适应环境。";
  }
}

/**
 * Get advice for light pollution conditions
 */
export function getLightPollutionAdvice(bortleScale: number, language: string = 'en'): string {
  if (!bortleScale || bortleScale < 1 || bortleScale > 9) {
    return language === 'en'
      ? "Light pollution data unavailable. Consider using a light pollution filter for best results."
      : "光污染数据不可用。考虑使用光污染滤镜以获得最佳效果。";
  }
  
  if (bortleScale <= 3) {
    return language === 'en'
      ? "Excellent dark sky conditions. Perfect for observing deep-sky objects without filters."
      : "极佳的暗空条件。非常适合不使用滤镜观测深空天体。";
  } else if (bortleScale <= 5) {
    return language === 'en'
      ? "Moderate light pollution. Consider using a light pollution filter for nebulae and galaxies."
      : "中等光污染。考虑使用光污染滤镜观测星云和星系。";
  } else if (bortleScale <= 7) {
    return language === 'en'
      ? "Significant light pollution. Focus on brighter objects, star clusters, and planets."
      : "光污染严重。专注于更亮的天体、星团和行星。";
  } else {
    return language === 'en'
      ? "Heavy light pollution. Best for lunar and planetary observation. Deep-sky objects will be challenging."
      : "严重光污染。最适合月球和行星观测。深空天体观测将会很有挑战性。";
  }
}

/**
 * Check for extreme weather alerts
 */
export function getExtremeWeatherAlerts(
  weatherCode: number | undefined,
  windSpeed: number | undefined,
  precipitation: number | undefined,
  language: string = 'en'
): { message: string; severity: 'warning' | 'alert' | 'advisory' } | null {
  // Check for high winds (> 30 km/h)
  if (windSpeed && windSpeed > 30) {
    return {
      message: language === 'en'
        ? "High winds may affect telescope stability. Consider additional stabilization or lower magnification."
        : "强风可能影响望远镜稳定性。考虑增加稳定措施或降低放大倍率。",
      severity: 'warning'
    };
  }
  
  // Check for precipitation
  if (precipitation && precipitation > 0.2) {
    return {
      message: language === 'en'
        ? "Precipitation detected. Protect your equipment from moisture damage."
        : "检测到降水。保护您的设备免受潮气损坏。",
      severity: 'alert'
    };
  }
  
  // Check for extreme weather conditions based on weather code
  if (weatherCode) {
    // Thunderstorm (code 200-299)
    if (weatherCode >= 200 && weatherCode < 300) {
      return {
        message: language === 'en'
          ? "Thunderstorms in the forecast. Observing is not recommended due to safety concerns."
          : "预报有雷暴。出于安全考虑，不建议进行观测。",
        severity: 'alert'
      };
    }
    
    // Heavy rain/snow (code 500+)
    if (weatherCode >= 500) {
      return {
        message: language === 'en'
          ? "Precipitation conditions detected. Equipment damage risk is high."
          : "检测到降水条件。设备损坏风险高。",
        severity: 'alert'
      };
    }
    
    // Fog/mist (code 700-799)
    if (weatherCode >= 700 && weatherCode < 800) {
      return {
        message: language === 'en'
          ? "Foggy conditions will significantly reduce visibility for astronomical objects."
          : "雾天条件将显著降低天文物体的可见度。",
        severity: 'advisory'
      };
    }
  }
  
  return null;
}
