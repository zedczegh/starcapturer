
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import PageTitle from '@/components/layout/PageTitle';
import LocationSelector from '@/components/common/LocationSelector';
import { SIQSLocation } from '@/utils/locationStorage';
import { toast } from 'sonner';
import GlobalMapSelector from '@/components/common/GlobalMapSelector';

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
            <CardContent>
              <LocationSelector 
                onLocationSelect={handleLocationSelect}
                buttonLabel={t("Open Map", "打开地图")}
                placeholder={t("Search for a city, landmark, or address...", "搜索城市、地标或地址...")}
                includeCurrentLocation={true}
              />
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
        
        {/* Map selector modal (hidden by default) */}
        <GlobalMapSelector />
      </Container>
    </div>
  );
};

export default PhotoPointsNearby;
