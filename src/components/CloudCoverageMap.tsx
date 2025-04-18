import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Compass, PlayCircle, PauseCircle, RefreshCw, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import L from 'leaflet';

interface CloudCoverageMapProps {
  latitude: number;
  longitude: number;
  name?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const CloudCoverageMap: React.FC<CloudCoverageMapProps> = ({
  latitude,
  longitude,
  name,
  onRefresh,
  isLoading = false
}) => {
  const { language, t } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [timeIndex, setTimeIndex] = useState<number>(0);
  const [times, setTimes] = useState<Date[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const animationRef = useRef<number | null>(null);
  
  const getCloudLayerUrl = (time: Date) => {
    const apiBase = "https://openmeteo.atmosfera.unam.mx/meteosat-10/cloudiness/"; 
    const timestamp = time.toISOString().replace(/[-:]/g, "").split(".")[0];
    return `${apiBase}${timestamp}Z.png`;
  };
  
  useEffect(() => {
    const now = new Date();
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    const newTimes: Date[] = [];
    for (let i = 0; i < 16; i++) {
      const time = new Date(now.getTime());
      time.setHours(time.getHours() + (i * 3));
      newTimes.push(time);
    }
    
    setTimes(newTimes);
    setCurrentTime(newTimes[0]);
  }, [lastUpdated]);
  
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = L.map(mapRef.current).setView([latitude, longitude], 4);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
      .openPopup();
    
    const cloudOverlay = L.imageOverlay(
      getCloudLayerUrl(currentTime),
      [[90, -180], [-90, 180]],
      { opacity: 0.6 }
    ).addTo(map);
    
    const updateCloudLayer = () => {
      cloudOverlay.setUrl(getCloudLayerUrl(currentTime));
    };
    
    const timeInterval = setInterval(updateCloudLayer, 1000);
    
    return () => {
      clearInterval(timeInterval);
      map.remove();
    };
  }, [latitude, longitude, name, currentTime]);
  
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = window.requestAnimationFrame(() => {
        setTimeout(() => {
          setTimeIndex(prevIndex => {
            const nextIndex = prevIndex + 1;
            if (nextIndex >= times.length) {
              setIsPlaying(false);
              return 0;
            }
            setCurrentTime(times[nextIndex]);
            return nextIndex;
          });
        }, 800);
      });
    }
    
    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, timeIndex, times]);
  
  const handleTimeChange = (value: number[]) => {
    const index = value[0];
    setTimeIndex(index);
    
    if (index < times.length) {
      setCurrentTime(times[index]);
    }
  };
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    setLastUpdated(new Date());
  };
  
  const formatTimeLabel = (date: Date) => {
    return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: language === 'en'
    });
  };
  
  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getTimeAgoLabel = () => {
    return formatDistanceToNow(lastUpdated, {
      addSuffix: true,
      locale: language === 'en' ? enUS : zhCN
    });
  };
  
  return (
    <Card className="glassmorphism border-cosmic-700/30 hover:border-cosmic-600/50 transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-gradient-blue">
            {t("Cloud Coverage Map", "云层覆盖地图")}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {t("Refresh", "刷新")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full h-[300px] md:h-[400px]" ref={mapRef}></div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                className="h-8 w-8 p-0"
              >
                {isPlaying ? (
                  <PauseCircle className="h-4 w-4" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm font-medium">
                {formatDateLabel(currentTime)} {formatTimeLabel(currentTime)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {t("Updated", "更新")} {getTimeAgoLabel()}
            </div>
          </div>
          
          <div className="pt-2">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {t("Forecast Timeline", "预报时间轴")}
              </span>
            </div>
            
            <Slider
              value={[timeIndex]}
              min={0}
              max={times.length - 1}
              step={1}
              onValueChange={handleTimeChange}
              disabled={isPlaying}
            />
            
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{formatDateLabel(times[0])} {formatTimeLabel(times[0])}</span>
              <span>{formatDateLabel(times[times.length - 1])} {formatTimeLabel(times[times.length - 1])}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-400 opacity-30 mr-1"></div>
              <span>{t("Clear", "晴朗")}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-400 opacity-60 mr-1"></div>
              <span>{t("Partly Cloudy", "部分多云")}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-400 opacity-90 mr-1"></div>
              <span>{t("Overcast", "阴天")}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CloudCoverageMap;
