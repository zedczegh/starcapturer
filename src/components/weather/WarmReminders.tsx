
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LightbulbIcon, ThermometerIcon, Wind, CloudRain, Moon, CloudOff, Umbrella } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DynamicLightbulbIcon } from '@/components/weather/DynamicIcons';

interface WarmRemindersProps {
  weatherData?: any;
  forecastData?: any;
  locationData?: any;
  longRangeForecast?: any;
}

const WarmReminders: React.FC<WarmRemindersProps> = ({
  weatherData,
  forecastData,
  locationData,
  longRangeForecast
}) => {
  const { t, language } = useLanguage();
  
  // Generate astronomy-focused reminders based on weather data
  const generateReminders = () => {
    const reminders = [];
    
    // Check for SIQS data
    if (locationData?.siqsResult) {
      const siqsScore = locationData.siqsResult.score;
      
      if (siqsScore <= 2) {
        reminders.push({
          icon: <CloudOff className="h-5 w-5 text-red-400" />,
          color: 'border-red-500/30 bg-red-950/20',
          title: t('Poor Viewing Conditions', '不佳的观测条件'),
          text: t(
            'Current conditions are not favorable for astronomy. Consider rescheduling your observation session.',
            '当前条件不适合天文观测。考虑重新安排您的观测活动。'
          )
        });
      } else if (siqsScore >= 7) {
        reminders.push({
          icon: <DynamicLightbulbIcon quality={siqsScore} className="h-5 w-5" />,
          color: 'border-green-500/30 bg-green-950/20',
          title: t('Excellent Viewing', '绝佳的观测条件'),
          text: t(
            'Current conditions are excellent for astronomy. Take advantage of this opportunity!',
            '当前条件非常适合天文观测。好好利用这个机会！'
          )
        });
      }
    }
    
    // Check for night forecast data
    if (forecastData?.hourly) {
      // Check for clear nights
      const nightHours = [];
      const now = new Date();
      
      for (let i = 0; i < forecastData.hourly.time.length; i++) {
        const time = new Date(forecastData.hourly.time[i]);
        const hours = time.getHours();
        
        // Only consider future night hours
        if (time > now && (hours >= 20 || hours <= 5)) {
          nightHours.push({
            time: forecastData.hourly.time[i],
            cloudCover: forecastData.hourly.cloud_cover?.[i],
            precipitation: forecastData.hourly.precipitation?.[i],
            humidity: forecastData.hourly.relative_humidity_2m?.[i],
            temperature: forecastData.hourly.temperature_2m?.[i],
            weatherCode: forecastData.hourly.weather_code?.[i]
          });
        }
      }
      
      // Check for clear nights
      if (nightHours.length > 0) {
        const clearest = nightHours.reduce((best, current) => 
          (current.cloudCover < best.cloudCover) ? current : best, nightHours[0]);
        
        if (clearest.cloudCover < 20) {
          reminders.push({
            icon: <Moon className="h-5 w-5 text-purple-400" />,
            color: 'border-purple-500/30 bg-purple-950/20',
            title: t('Clear Night Coming', '即将到来的晴朗夜晚'),
            text: t(
              `Great stargazing conditions expected at ${new Date(clearest.time).getHours()}:00 with just ${clearest.cloudCover}% cloud cover.`,
              `预计${new Date(clearest.time).getHours()}:00有良好的观星条件，云量仅为${clearest.cloudCover}%。`
            )
          });
        }
        
        // Check for very cold conditions
        const coldest = nightHours.reduce((coldest, current) => 
          (current.temperature < coldest.temperature) ? current : coldest, nightHours[0]);
          
        if (coldest.temperature < 5) {
          reminders.push({
            icon: <ThermometerIcon className="h-5 w-5 text-blue-400" />,
            color: 'border-blue-500/30 bg-blue-950/20',
            title: t('Cold Night Expected', '预计寒冷的夜晚'),
            text: t(
              `Temperatures will drop to ${coldest.temperature.toFixed(1)}°C. Dress warmly for your observation session.`,
              `温度将下降至${coldest.temperature.toFixed(1)}°C。请穿暖和衣物进行观测。`
            )
          });
        }
        
        // Check for rain
        const rainyHours = nightHours.filter(hour => hour.precipitation > 0.5);
        if (rainyHours.length > 0) {
          reminders.push({
            icon: <CloudRain className="h-5 w-5 text-blue-400" />,
            color: 'border-blue-500/30 bg-blue-950/20',
            title: t('Rain Expected', '预计有雨'),
            text: t(
              'Precipitation expected tonight. Consider bringing rain gear or rescheduling your observation.',
              '今晚预计有降水。考虑携带雨具或重新安排您的观测时间。'
            )
          });
        }
      }
    }
    
    // Long-range forecasts for planning
    if (longRangeForecast?.daily) {
      // Find the clearest night in the next 7 days
      const clearestDay = { date: '', cloudCover: 100, index: -1 };
      
      for (let i = 0; i < longRangeForecast.daily.time.length && i < 7; i++) {
        const cloudCover = longRangeForecast.daily.cloud_cover_mean?.[i];
        
        if (cloudCover !== undefined && cloudCover < clearestDay.cloudCover) {
          clearestDay.date = longRangeForecast.daily.time[i];
          clearestDay.cloudCover = cloudCover;
          clearestDay.index = i;
        }
      }
      
      if (clearestDay.index > 0 && clearestDay.cloudCover < 30) {
        const date = new Date(clearestDay.date);
        const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
        const formattedDate = date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', dateOptions);
        
        reminders.push({
          icon: <LightbulbIcon className="h-5 w-5 text-yellow-400" />,
          color: 'border-yellow-500/30 bg-yellow-950/20',
          title: t('Best Night This Week', '本周最佳夜晚'),
          text: t(
            `${formattedDate} looks like the best night for stargazing with only ${clearestDay.cloudCover.toFixed(0)}% cloud cover.`,
            `${formattedDate}看起来是本周观星的最佳夜晚，云量仅为${clearestDay.cloudCover.toFixed(0)}%。`
          )
        });
      }
      
      // Find high wind days to avoid
      const highWindDays = [];
      
      for (let i = 0; i < longRangeForecast.daily.time.length && i < 7; i++) {
        const windSpeed = longRangeForecast.daily.wind_speed_10m_max?.[i];
        
        if (windSpeed !== undefined && windSpeed > 20) {
          highWindDays.push({
            date: longRangeForecast.daily.time[i],
            windSpeed
          });
        }
      }
      
      if (highWindDays.length > 0) {
        const windyDay = highWindDays[0];
        const date = new Date(windyDay.date);
        const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long' };
        const formattedDate = date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', dateOptions);
        
        reminders.push({
          icon: <Wind className="h-5 w-5 text-blue-400" />,
          color: 'border-blue-500/30 bg-blue-950/20',
          title: t('High Winds Expected', '预计有强风'),
          text: t(
            `${formattedDate} will have winds up to ${windyDay.windSpeed.toFixed(0)} km/h, which may affect telescope stability.`,
            `${formattedDate}将有高达${windyDay.windSpeed.toFixed(0)}公里/小时的风速，可能会影响望远镜的稳定性。`
          )
        });
      }
      
      // Check for rainy week
      const rainyDays = [];
      
      for (let i = 0; i < longRangeForecast.daily.time.length && i < 7; i++) {
        const precipitation = longRangeForecast.daily.precipitation_sum?.[i];
        const precipProb = longRangeForecast.daily.precipitation_probability_max?.[i];
        
        if ((precipitation !== undefined && precipitation > 5) || 
            (precipProb !== undefined && precipProb > 70)) {
          rainyDays.push({
            date: longRangeForecast.daily.time[i],
            precipitation,
            precipProb
          });
        }
      }
      
      if (rainyDays.length > 2) {
        reminders.push({
          icon: <Umbrella className="h-5 w-5 text-cyan-400" />,
          color: 'border-cyan-500/30 bg-cyan-950/20',
          title: t('Rainy Week Ahead', '未来一周多雨'),
          text: t(
            'Multiple rainy days expected this week. Plan indoor astronomy activities or virtual observation sessions.',
            '本周预计有多个雨天。计划室内天文活动或虚拟观测课程。'
          )
        });
      }
    }
    
    // Return a default reminder if no specific ones are generated
    if (reminders.length === 0) {
      reminders.push({
        icon: <LightbulbIcon className="h-5 w-5 text-amber-400" />,
        color: 'border-amber-500/30 bg-amber-950/20',
        title: t('Astronomy Tip', '天文小贴士'),
        text: t(
          'Clear, dark skies are best for observing deep sky objects like galaxies and nebulae.',
          '晴朗、黑暗的天空最适合观测星系和星云等深空天体。'
        )
      });
    }
    
    // Limit to 3 reminders to avoid overwhelming the user
    return reminders.slice(0, 3);
  };
  
  const reminders = generateReminders();
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
        <CardTitle className="text-lg text-gradient-blue">
          {t('Astronomy Reminders', '天文提醒')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {reminders.map((reminder, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg border ${reminder.color} flex gap-3 items-start transition-all hover:scale-[1.01] duration-200`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {reminder.icon}
            </div>
            <div>
              <h3 className="font-medium text-sm">{reminder.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{reminder.text}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default WarmReminders;
