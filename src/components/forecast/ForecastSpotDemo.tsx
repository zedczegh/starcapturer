
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ForecastSpotMap from './ForecastSpotMap';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { ForecastDayAstroData } from '@/services/forecast/types/forecastTypes';

interface ForecastSpotDemoProps {
  initialLatitude?: number;
  initialLongitude?: number;
  className?: string;
}

const ForecastSpotDemo: React.FC<ForecastSpotDemoProps> = ({
  initialLatitude = 40.712776,
  initialLongitude = -74.005974,
  className = ''
}) => {
  const { t } = useLanguage();
  
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [radiusKm, setRadiusKm] = useState(50);
  const [dayIndex, setDayIndex] = useState(0);
  const [minQuality, setMinQuality] = useState(5);
  const [selectedSpot, setSelectedSpot] = useState<SharedAstroSpot | null>(null);
  
  const handleSpotSelected = (spot: SharedAstroSpot, forecast?: ForecastDayAstroData) => {
    setSelectedSpot(spot);
    console.log("Selected spot:", spot, "with forecast:", forecast);
  };
  
  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle>{t("Forecast Spot Generator", "预测地点生成器")}</CardTitle>
        <CardDescription>
          {t("Find potential astronomy observation spots based on forecast data", 
             "根据预测数据寻找潜在的天文观测地点")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="map">
          <TabsList className="mb-4">
            <TabsTrigger value="map">{t("Map View", "地图视图")}</TabsTrigger>
            <TabsTrigger value="settings">{t("Settings", "设置")}</TabsTrigger>
            {selectedSpot && (
              <TabsTrigger value="details">{t("Spot Details", "地点详情")}</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="map">
            <ForecastSpotMap 
              latitude={latitude}
              longitude={longitude}
              radiusKm={radiusKm}
              dayIndex={dayIndex}
              minQuality={minQuality}
              onSpotSelected={handleSpotSelected}
              height="500px"
            />
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>{t("Search Radius", "搜索半径")} ({radiusKm} km)</Label>
                <Slider 
                  value={[radiusKm]} 
                  min={10} 
                  max={200} 
                  step={10}
                  onValueChange={(value) => setRadiusKm(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t("Forecast Day", "预测日期")} ({dayIndex === 0 ? t("Today", "今天") : `+${dayIndex} ${t("days", "天")}`})</Label>
                <Slider 
                  value={[dayIndex]} 
                  min={0} 
                  max={14} 
                  step={1}
                  onValueChange={(value) => setDayIndex(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t("Minimum Quality", "最低质量")} ({minQuality}/10)</Label>
                <Slider 
                  value={[minQuality]} 
                  min={1} 
                  max={9} 
                  step={1}
                  onValueChange={(value) => setMinQuality(value[0])}
                />
              </div>
            </div>
          </TabsContent>
          
          {selectedSpot && (
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedSpot.name}</CardTitle>
                  <CardDescription>
                    {t("Quality Score", "质量评分")}: {(selectedSpot.siqs / 10).toFixed(1)}/10
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">{t("Latitude", "纬度")}:</div>
                      <div>{selectedSpot.latitude.toFixed(5)}</div>
                      
                      <div className="font-medium">{t("Longitude", "经度")}:</div>
                      <div>{selectedSpot.longitude.toFixed(5)}</div>
                      
                      <div className="font-medium">{t("Bortle Scale", "波特尔等级")}:</div>
                      <div>{selectedSpot.bortleScale}</div>
                      
                      <div className="font-medium">{t("Is Viable", "是否可行")}:</div>
                      <div>{selectedSpot.isViable ? t("Yes", "是") : t("No", "否")}</div>
                      
                      <div className="font-medium">{t("Distance", "距离")}:</div>
                      <div>{selectedSpot.distance.toFixed(1)} km</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ForecastSpotDemo;
