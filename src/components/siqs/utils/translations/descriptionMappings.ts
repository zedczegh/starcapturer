
/**
 * Direct mappings for specific weather descriptions
 * Used for more accurate translations than word-by-word replacement
 */
export const descriptionMappings: Record<string, string> = {
  // Cloud cover descriptions
  "Clear skies with 0% cloud cover, excellent for imaging": "晴朗天空，0%云量，非常适合成像",
  "Clear skies with low cloud cover, excellent for imaging": "晴朗天空，低云量，非常适合成像",
  "Mostly clear with moderate cloud cover, good for imaging": "大部分晴朗，中等云量，适合成像",
  "Partly cloudy, may affect quality": "部分多云，可能影响质量",
  "Cloudy conditions, challenging for imaging": "多云条件，成像具有挑战性",
  "Heavy cloud cover makes imaging difficult": "重度云层覆盖使成像困难",
  
  // Light pollution descriptions
  "Very dark skies (Bortle 1-2), excellent for deep sky objects": "非常黑暗的天空（波尔特1-2级），非常适合拍摄深空天体",
  "Dark skies (Bortle 3-4), good for most objects": "黑暗的天空（波尔特3-4级），适合拍摄大多数天体",
  "Moderate light pollution (Bortle 5-6), limits faint objects": "中等光污染（波尔特5-6级），限制拍摄暗弱天体",
  "Significant light pollution (Bortle 7), challenging conditions": "显著光污染（波尔特7级），观测条件具有挑战性",
  "Severe light pollution (Bortle 8-9), limited to bright objects": "严重光污染（波尔特8-9级），仅限于拍摄明亮天体",
  
  // Seeing conditions descriptions
  "Excellent seeing conditions, perfect for planetary detail": "极佳的视宁度，非常适合拍摄行星细节",
  "Good seeing conditions, suitable for high magnification": "良好的视宁度，适合高倍率观测",
  "Average seeing conditions, moderate effect on detail": "一般的视宁度，对细节有中等影响",
  "Poor seeing conditions, limits fine detail": "较差的视宁度，限制精细细节",
  "Very poor seeing conditions, significant turbulence": "非常差的视宁度，大气湍流明显",
  
  // Wind descriptions
  "Calm conditions (0-5 km/h), excellent for imaging": "平静条件（0-5公里/小时），非常适合成像",
  "Light breeze (5-15 km/h), minimal impact on stability": "微风（5-15公里/小时），对稳定性影响最小",
  "Moderate wind (15-25 km/h), may affect tracking": "中等风速（15-25公里/小时），可能影响追踪",
  "Strong wind, challenging for stable imaging": "强风，对稳定成像具有挑战性",
  "Very strong wind, not recommended for imaging": "非常强的风，不建议进行成像",
  
  // Humidity descriptions
  "Low humidity, excellent conditions": "湿度低，极佳条件",
  "Moderate humidity, good conditions": "湿度适中，良好条件",
  "High humidity, may cause dew formation": "湿度高，可能导致设备凝露",
  "Very high humidity, requires dew prevention": "湿度非常高，需要防雾措施",
  
  // AQI descriptions
  "Excellent air quality (AQI: 0-25)": "空气质量极佳（AQI：0-25）",
  "Good air quality (AQI: 26-50)": "空气质量良好（AQI：26-50）",
  "Moderate air quality, slight effect on visibility": "空气质量一般，对可见度有轻微影响",
  "Poor air quality, reduced visibility": "空气质量较差，可见度降低",
  "Very poor air quality, significantly affects imaging": "空气质量非常差，显著影响成像",
  
  // Nighttime descriptions
  "Nighttime average (6PM to 8AM)": "夜间平均值（18:00至次日08:00）",
  
  // Clear sky rate descriptions
  "Annual clear sky rate (0-20%), challenging for regular imaging": "年均晴空率（0-20%），规律成像具有挑战性",
  "Annual clear sky rate (20-40%), limited clear nights for imaging": "年均晴空率（20-40%），可用于成像的晴朗夜晚有限",
  "Annual clear sky rate (40-60%), acceptable for imaging": "年均晴空率（40-60%），可接受的成像条件",
  "Annual clear sky rate (60-80%), favorable for astrophotography": "年均晴空率（60-80%），有利于天文摄影",
  "Annual clear sky rate (80-100%), ideal for astrophotography": "年均晴空率（80-100%），天文摄影的理想条件"
};
