
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import PageTitle from '@/components/layout/PageTitle';
import BackButton from '@/components/navigation/BackButton';
import LocationMap from '@/components/location/LocationMap';
import { ArrowLeft, Map } from 'lucide-react';
import { toast } from 'sonner';

const PhotoPointsView = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  
  useEffect(() => {
    if (location.state?.location) {
      setSelectedLocation(location.state.location);
    } else {
      // If no location was passed, redirect back to nearby page
      navigate('/photo-points/nearby');
      toast.error(t(
        "No location selected. Please select a location first.",
        "未选择位置。请先选择一个位置。"
      ));
    }
  }, [location.state, navigate, t]);
  
  if (!selectedLocation) {
    return (
      <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat pt-28">
        <Container>
          <div className="h-[60vh] flex flex-col items-center justify-center">
            <p className="text-2xl text-primary mb-6">
              {t("Loading...", "加载中...")}
            </p>
          </div>
        </Container>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <Container className="pt-28 pb-20">
        <BackButton 
          destination="/photo-points/nearby" 
          size="sm"
          className="mb-6"
        />
        
        <PageTitle 
          title={t("Photo Points near", "附近的拍摄点") + " " + selectedLocation.name}
          description={t(
            "Discover the best photography locations in this area",
            "探索该地区最佳的摄影地点"
          )}
        />
        
        <div className="grid grid-cols-1 gap-6 mt-6">
          <Card className="bg-cosmic-900/60 backdrop-blur-sm border-cosmic-700/30 overflow-hidden p-0">
            <div className="h-[60vh] w-full relative">
              <LocationMap 
                latitude={selectedLocation.latitude}
                longitude={selectedLocation.longitude}
                zoom={10}
                interactive={true}
                showPhotoPoints={true}
              />
            </div>
          </Card>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* This would be replaced with actual photo points from an API */}
            <Card className="bg-cosmic-900/60 backdrop-blur-sm border-cosmic-700/30 p-6">
              <h3 className="text-lg font-medium text-primary mb-2">
                {t("No Photo Points Found", "未找到拍摄点")}
              </h3>
              <p className="text-muted-foreground">
                {t(
                  "There are no registered photo points in this area yet. You can be the first to add one!",
                  "该地区尚无已注册的拍摄点。您可以成为第一个添加拍摄点的人！"
                )}
              </p>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default PhotoPointsView;
