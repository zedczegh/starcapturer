
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Star, MapPin, NavigationIcon, Share2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getRecommendedPhotoPoints, generateBaiduMapsUrl, SharedAstroSpot } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

interface RecommendedPhotoPointsProps {
  onSelectPoint: (point: SharedAstroSpot) => void;
  className?: string;
  userLocation?: { latitude: number; longitude: number } | null;
}

const RecommendedPhotoPoints: React.FC<RecommendedPhotoPointsProps> = ({ 
  onSelectPoint,
  className,
  userLocation
}) => {
  const [recommendedPoints, setRecommendedPoints] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const points = getRecommendedPhotoPoints(userLocation);
    setRecommendedPoints(points);
    setLoading(false);
  }, [userLocation]);

  const handleSelectPoint = (point: SharedAstroSpot) => {
    onSelectPoint(point);
    toast({
      title: "Photo Point Selected",
      description: `Selected ${point.name} by ${point.photographer}`,
    });
  };

  const handleNavigate = (e: React.MouseEvent, point: SharedAstroSpot) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    window.open(generateBaiduMapsUrl(point.latitude, point.longitude), '_blank');
  };

  const handleShare = (e: React.MouseEvent, point: SharedAstroSpot) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    
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
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Recommended Photo Points
          {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </h3>
        <Link to="/photo-points">
          <Button variant="link" size="sm" className="text-primary">
            View All Points
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {recommendedPoints.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No photo points found near your location.
          </div>
        ) : (
          recommendedPoints.map((point) => (
            <div 
              key={point.id}
              className="glassmorphism p-3 rounded-lg cursor-pointer hover:bg-background/50 transition-colors"
              onClick={() => handleSelectPoint(point)}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm">{point.name}</h4>
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-yellow-400 mr-1" fill="#facc15" />
                  <span className="text-xs font-medium">{point.siqs.toFixed(1)}</span>
                </div>
              </div>
              
              {point.photoUrl && (
                <div className="mb-2 h-24 w-full overflow-hidden rounded-md">
                  <img 
                    src={point.photoUrl} 
                    alt={point.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{point.description}</p>
              
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-primary-foreground/70">
                  By {point.photographer}
                </div>
                {point.distance !== undefined && (
                  <div className="text-xs font-medium">
                    {point.distance < 100 
                      ? `${Math.round(point.distance)} km away` 
                      : `${Math.round(point.distance / 100) * 100} km away`}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-2">
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecommendedPhotoPoints;
