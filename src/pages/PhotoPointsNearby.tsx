
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Camera, MapPin, NavigationIcon, Share2, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getSharedAstroSpots, generateBaiduMapsUrl, SharedAstroSpot } from "@/lib/api";
import NavBar from "@/components/NavBar";

const PhotoPointsNearby: React.FC = () => {
  const [photoPoints, setPhotoPoints] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    // Get user's location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Access Denied",
            description: "We can't show nearby spots without your location.",
            variant: "destructive",
          });
        }
      );
    }
    
    // Load all shared photo points
    setLoading(true);
    const points = getSharedAstroSpots();
    setPhotoPoints(points);
    setLoading(false);
  }, []);

  // Calculate distance if user location is available
  const photoPointsWithDistance = React.useMemo(() => {
    if (!userLocation) return photoPoints;
    
    return photoPoints.map(point => ({
      ...point,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        point.latitude,
        point.longitude
      )
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [photoPoints, userLocation]);

  // Calculate distance between two coordinates in km (haversine formula)
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  }

  const handleNavigate = (e: React.MouseEvent, point: SharedAstroSpot) => {
    e.preventDefault(); // Prevent default link behavior
    window.open(generateBaiduMapsUrl(point.latitude, point.longitude), '_blank');
  };

  const handleShare = (e: React.MouseEvent, point: SharedAstroSpot) => {
    e.preventDefault(); // Prevent default link behavior
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: `Astrophotography Spot: ${point.name}`,
        text: `Check out this amazing astrophotography location: ${point.name}. SIQS: ${point.siqs.toFixed(1)}`,
        url: window.location.origin + `/location/${point.id}`,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback to copying to clipboard
      const shareUrl = window.location.origin + `/location/${point.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: "Link Copied",
          description: "Location link copied to clipboard!",
        });
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-cosmic-900">
      <NavBar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <Camera className="h-8 w-8 text-primary mr-3" />
            Photo Points Nearby
          </h1>
          <Link to="/share">
            <Button>
              <MapPin className="h-4 w-4 mr-2" />
              Share New Location
            </Button>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        ) : photoPointsWithDistance.length === 0 ? (
          <div className="text-center py-16 glassmorphism rounded-lg">
            <Camera className="h-16 w-16 text-primary/50 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Photo Points Found</h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              Be the first to share an astrophotography location in this area!
            </p>
            <Link to="/share">
              <Button size="lg">
                <MapPin className="h-5 w-5 mr-2" />
                Share Your Spot
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photoPointsWithDistance.map((point) => (
              <Link 
                key={point.id} 
                to={`/location/${point.id}`}
                className="glassmorphism p-4 rounded-lg hover:bg-background/50 transition-colors flex flex-col h-full"
              >
                {point.photoUrl && (
                  <div className="h-48 w-full overflow-hidden rounded-md mb-4">
                    <img 
                      src={point.photoUrl} 
                      alt={point.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-semibold text-lg">{point.name}</h2>
                  <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium text-sm">{point.siqs.toFixed(1)}</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow">
                  {point.description}
                </p>
                
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs text-primary-foreground/70">
                    By {point.photographer}
                  </div>
                  {point.distance !== undefined && (
                    <div className="text-xs font-medium bg-background/30 px-2 py-1 rounded-full">
                      {point.distance < 1 
                        ? `${Math.round(point.distance * 1000)} m away`
                        : point.distance < 100 
                          ? `${Math.round(point.distance)} km away` 
                          : `${Math.round(point.distance / 100) * 100} km away`}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={(e) => handleNavigate(e, point)}
                        >
                          <NavigationIcon className="h-3.5 w-3.5 mr-1.5" />
                          Navigate
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Get directions to this location</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={(e) => handleShare(e, point)}
                        >
                          <Share2 className="h-3.5 w-3.5 mr-1.5" />
                          Share
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share this location with others</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoPointsNearby;
