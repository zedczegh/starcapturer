
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import ShareLocationForm from "@/components/ShareLocationForm";
import { toast } from "@/components/ui/use-toast";

const ShareLocation = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; name?: string } | null>(null);
  
  useEffect(() => {
    // Attempt to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          
          try {
            // This would be a call to reverse geocode the coordinates
            // For simplicity, we're using a placeholder
            const locationName = `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setUserLocation(prev => prev ? { ...prev, name: locationName } : null);
          } catch (error) {
            console.error("Error getting location name:", error);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Access Failed",
            description: "We couldn't access your current location. You can still enter coordinates manually.",
            variant: "destructive",
          });
        }
      );
    }
  }, []);
  
  return (
    <div className="min-h-screen">
      <NavBar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Share Your Astrophotography Spot</h1>
          <p className="text-muted-foreground mb-8">
            Help fellow astrophotographers discover amazing locations by sharing your favorite 
            spots for stargazing and astrophotography. Your contributions will be visible to the 
            community as recommended photo points.
          </p>
          
          <ShareLocationForm userLocation={userLocation} />
        </div>
      </main>
    </div>
  );
};

export default ShareLocation;
