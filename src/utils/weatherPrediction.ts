
/**
 * Calculate a weather score for a specific forecast day (0-14)
 * Higher score means better conditions for astronomy
 * Returns a value between 0.5 and 1.5 to be used as a multiplier for SIQS
 */
export function getWeatherScoreForDay(forecastData: any, forecastDay: number = 0): number {
  if (!forecastData) {
    return 1.0; // Default neutral score
  }

  try {
    // Different data structure based on forecast type
    if (forecastDay <= 2 && forecastData.hourly) {
      // For days 0-2, we have hourly data
      // Calculate night hours for the selected day (7pm to 5am)
      const nightHours = getNightHoursForDay(forecastData, forecastDay);
      return calculateHourlyWeatherScore(nightHours);
    } else if (forecastData.daily) {
      // For days 3-14, use daily data
      return calculateDailyWeatherScore(forecastData, forecastDay);
    }
    
    return 1.0; // Default neutral score
  } catch (error) {
    console.error("Error calculating weather score:", error);
    return 1.0; // Default neutral score on error
  }
}

/**
 * Get night hours data for a specific day
 */
function getNightHoursForDay(forecastData: any, day: number): any[] {
  if (!forecastData.hourly || !forecastData.hourly.time) {
    return [];
  }
  
  const nightHours = [];
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + day);
  
  // Format as YYYY-MM-DD for comparison
  const targetDateStr = targetDate.toISOString().split('T')[0];
  const nextDayDate = new Date(targetDate);
  nextDayDate.setDate(targetDate.getDate() + 1);
  const nextDayStr = nextDayDate.toISOString().split('T')[0];
  
  // Get evening hours (7pm-midnight) of target day + morning hours (midnight-5am) of next day
  for (let i = 0; i < forecastData.hourly.time.length; i++) {
    const time = forecastData.hourly.time[i];
    const hour = new Date(time).getHours();
    
    if (time.includes(targetDateStr) && hour >= 19) {
      // Evening hours of target day (7pm-midnight)
      nightHours.push({
        time,
        cloud_cover: forecastData.hourly.cloud_cover?.[i] || 0,
        precipitation: forecastData.hourly.precipitation?.[i] || 0,
        wind_speed: forecastData.hourly.wind_speed_10m?.[i] || 0,
        humidity: forecastData.hourly.relative_humidity_2m?.[i] || 50
      });
    } else if (time.includes(nextDayStr) && hour < 5) {
      // Morning hours of next day (midnight-5am)
      nightHours.push({
        time,
        cloud_cover: forecastData.hourly.cloud_cover?.[i] || 0,
        precipitation: forecastData.hourly.precipitation?.[i] || 0,
        wind_speed: forecastData.hourly.wind_speed_10m?.[i] || 0,
        humidity: forecastData.hourly.relative_humidity_2m?.[i] || 50
      });
    }
  }
  
  return nightHours;
}

/**
 * Calculate weather score based on hourly data
 * Returns a value between 0.5 and 1.5
 */
function calculateHourlyWeatherScore(hourlyData: any[]): number {
  if (!hourlyData || hourlyData.length === 0) {
    return 1.0;
  }
  
  // Calculate average values
  let totalCloudCover = 0;
  let totalPrecipitation = 0;
  let totalWindSpeed = 0;
  let totalHumidity = 0;
  
  hourlyData.forEach(hour => {
    totalCloudCover += hour.cloud_cover || 0;
    totalPrecipitation += hour.precipitation || 0;
    totalWindSpeed += hour.wind_speed || 0;
    totalHumidity += hour.humidity || 50;
  });
  
  const avgCloudCover = totalCloudCover / hourlyData.length;
  const avgPrecipitation = totalPrecipitation / hourlyData.length;
  const avgWindSpeed = totalWindSpeed / hourlyData.length;
  const avgHumidity = totalHumidity / hourlyData.length;
  
  // Calculate scores (higher is better)
  // Cloud cover: 0% is best (score=1), 100% is worst (score=0)
  const cloudScore = 1 - (avgCloudCover / 100);
  
  // Precipitation: 0mm is best (score=1), >=5mm is worst (score=0)
  const precipScore = Math.max(0, 1 - (avgPrecipitation / 5));
  
  // Wind: 0-3 km/h is best (score=1), >=20 km/h is worst (score=0)
  const windScore = Math.max(0, 1 - Math.max(0, (avgWindSpeed - 3) / 17));
  
  // Humidity: <50% is best (score=1), >90% is worst (score=0)
  const humidityScore = avgHumidity <= 50 ? 1 : Math.max(0, 1 - ((avgHumidity - 50) / 40));
  
  // Weight the factors (cloud cover is most important for astronomy)
  const weightedScore = 
    (cloudScore * 0.5) +     // Cloud cover: 50% importance
    (precipScore * 0.3) +    // Precipitation: 30% importance
    (windScore * 0.1) +      // Wind: 10% importance
    (humidityScore * 0.1);   // Humidity: 10% importance
  
  // Convert to a multiplier between 0.5 and 1.5
  return 0.5 + weightedScore;
}

/**
 * Calculate weather score based on daily data
 * Returns a value between 0.5 and 1.5
 */
function calculateDailyWeatherScore(forecastData: any, day: number): number {
  if (!forecastData.daily) return 1.0;
  
  const dailyIndex = Math.min(day, forecastData.daily.time.length - 1);
  
  // Extract daily values
  const cloudCover = forecastData.daily.cloud_cover_mean?.[dailyIndex] || 50;
  const precipitation = forecastData.daily.precipitation_sum?.[dailyIndex] || 0;
  const precipProb = forecastData.daily.precipitation_probability_max?.[dailyIndex] || 0;
  const windSpeed = forecastData.daily.wind_speed_10m_max?.[dailyIndex] || 0;
  const humidity = forecastData.daily.relative_humidity_2m_mean?.[dailyIndex] || 50;
  const weatherCode = forecastData.daily.weather_code?.[dailyIndex] || 0;
  
  // Calculate scores (higher is better)
  const cloudScore = 1 - (cloudCover / 100);
  const precipScore = Math.max(0, 1 - (precipitation / 10)) * Math.max(0, 1 - (precipProb / 100));
  const windScore = Math.max(0, 1 - Math.max(0, (windSpeed - 3) / 17));
  const humidityScore = humidity <= 50 ? 1 : Math.max(0, 1 - ((humidity - 50) / 40));
  
  // Weather code adjustment (clear sky gets bonus, stormy gets penalty)
  let weatherCodeBonus = 0;
  if ([0, 1].includes(weatherCode)) {
    // Clear sky - bonus
    weatherCodeBonus = 0.2;
  } else if ([95, 96, 99].includes(weatherCode)) {
    // Thunderstorm - heavy penalty
    weatherCodeBonus = -0.3;
  } else if ([80, 81, 82].includes(weatherCode)) {
    // Rain showers - moderate penalty
    weatherCodeBonus = -0.2;
  }
  
  // Weight the factors
  const weightedScore = 
    (cloudScore * 0.4) +       // Cloud cover: 40% importance
    (precipScore * 0.3) +      // Precipitation: 30% importance
    (windScore * 0.1) +        // Wind: 10% importance
    (humidityScore * 0.1) +    // Humidity: 10% importance
    (weatherCodeBonus);        // Weather code bonus/penalty
  
  // Convert to a multiplier between 0.5 and 1.5
  return Math.max(0.5, Math.min(1.5, 0.5 + weightedScore));
}

/**
 * Get forecast day from date string
 */
export function getForecastDayFromDate(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, Math.min(14, diffDays));
}
