
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import PageTitle from '@/components/layout/PageTitle';
import LocationSelector from '@/components/common/LocationSelector';
import { SIQSLocation } from '@/utils/locationStorage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Map } from 'lucide-react';

const PhotoPointsNearby = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<SIQSLocation | null>(null);

  // Handle location selection
  const handleLocationSelect = (location: SIQSLocation) => {
    setSelectedLocation(location);
    toast.success(
      t(`Selected location: ${location.name}`, `已选择位置：${location.name}`),
      {
        description: t(
          "Now you can view photo points near this location",
          "现在您可以查看该位置附近的拍摄点"
        )
      }
    );
    
    // Navigate to the photo points view with the selected location
    navigate('/photo-points/view', {
      state: {
        location: {
          ...location,
          fromPhotoPoints: true 
        }
      }
    });
  };

  // Function to open the global map selector
  const openMapSelector = () => {
    // Dispatch a custom event that will be caught by the GlobalMapSelector component
    const event = new CustomEvent('open-global-map-selector', { 
      detail: { 
        onSelect: handleLocationSelect,
        title: t("Select Location for Photo Points", "选择拍摄点位置"),
        description: t(
          "Choose a location to view nearby photo points",
          "选择一个位置以查看附近的拍摄点"
        )
      } 
    });
    document.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <Container className="pt-28 pb-20">
        <PageTitle 
          title={t("Photo Points Nearby", "附近拍摄点")}
          description={t(
            "Find the best photography locations near any place on Earth",
            "寻找地球上任何地方附近最好的摄影位置"
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-cosmic-900/60 backdrop-blur-sm border-cosmic-700/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-primary">
                {t("Select a Location", "选择位置")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <LocationSelector 
                onLocationSelect={handleLocationSelect}
                buttonLabel={t("Search", "搜索")}
                placeholder={t("Search for a city, landmark, or address...", "搜索城市、地标或地址...")}
                includeCurrentLocation={true}
              />
              
              <div className="text-center">
                <span className="px-3 text-muted-foreground">{t("or", "或")}</span>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center space-x-2"
                onClick={openMapSelector}
              >
                <Map className="h-4 w-4" />
                <span>{t("Open Map", "打开地图")}</span>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-cosmic-900/60 backdrop-blur-sm border-cosmic-700/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-primary">
                {t("Why Photo Points?", "为什么选择拍摄点？")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                {t(
                  "Photo Points are locations that have been verified as excellent spots for astrophotography or landscape photography.",
                  "拍摄点是已被验证为天文摄影或风景摄影绝佳场所的位置。"
                )}
              </p>
              <p>
                {t(
                  "These locations often have special features like clear horizons, interesting foregrounds, or exceptional dark skies.",
                  "这些位置通常具有特殊特征，如清晰的地平线、有趣的前景或卓越的暗空。"
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default PhotoPointsNearby;
