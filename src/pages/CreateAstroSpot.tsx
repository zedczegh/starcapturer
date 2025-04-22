
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from '@/components/ui/card';
import NavBar from '@/components/NavBar';
import LocationMap from '@/components/location/LocationMap';
import CreateAstroSpotForm from '@/components/astroSpots/CreateAstroSpotForm';
import { Button } from '@/components/ui/button';

const CreateAstroSpot: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Test location: Mount Tianshan Observatory, Xinjiang, China
  const testLocation = {
    latitude: 43.1233,
    longitude: 87.3152,
    locationName: "Mount Tianshan Observatory"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{t("Create My Astro Spot", "创建我的观星点")}</h1>
            <Button 
              variant="outline"
              onClick={() => navigate('/create-astro-spot', { 
                state: { 
                  latitude: testLocation.latitude, 
                  longitude: testLocation.longitude, 
                  locationName: testLocation.locationName 
                } 
              })}
            >
              {t("Load Test Location", "加载测试位置")}
            </Button>
          </div>

          <div className="h-[300px] mb-6">
            <LocationMap
              latitude={location.state?.latitude || testLocation.latitude}
              longitude={location.state?.longitude || testLocation.longitude}
              name={location.state?.locationName || testLocation.locationName}
              editable={false}
            />
          </div>
          
          <CreateAstroSpotForm
            latitude={location.state?.latitude || testLocation.latitude}
            longitude={location.state?.longitude || testLocation.longitude}
            locationName={location.state?.locationName || testLocation.locationName}
          />
        </Card>
      </main>
    </div>
  );
};

export default CreateAstroSpot;
