
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from '@/components/ui/card';
import NavBar from '@/components/NavBar';
import LocationMap from '@/components/location/LocationMap';
import CreateAstroSpotForm from '@/components/astroSpots/CreateAstroSpotForm';

const CreateAstroSpot: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { latitude, longitude, locationName } = location.state || {};

  if (!latitude || !longitude) {
    navigate('/photo-points');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">{t("Create My Astro Spot", "创建我的观星点")}</h1>
          <div className="h-[300px] mb-6">
            <LocationMap
              latitude={latitude}
              longitude={longitude}
              name={locationName || t("New Astro Spot", "新观星点")}
              editable={false}
            />
          </div>
          <CreateAstroSpotForm
            latitude={latitude}
            longitude={longitude}
            locationName={locationName}
          />
        </Card>
      </main>
    </div>
  );
};

export default CreateAstroSpot;
