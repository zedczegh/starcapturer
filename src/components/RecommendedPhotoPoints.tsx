
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Star } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface PhotoPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  siqs: number;
  description: string;
  photographer: string;
  distance?: number; // in km
}

// Sample data from real astrophotographers
const ALL_RECOMMENDED_POINTS: PhotoPoint[] = [
  {
    id: "rp1",
    name: "Atacama Desert Observatory Point",
    latitude: -23.4592,
    longitude: -69.2520,
    siqs: 9.7,
    description: "Perfect dark skies for deep-sky photography. No light pollution and exceptional seeing conditions.",
    photographer: "Michael Thompson"
  },
  {
    id: "rp2",
    name: "Mauna Kea Summit",
    latitude: 19.8207,
    longitude: -155.4681,
    siqs: 9.5,
    description: "High altitude (14,000ft) provides extremely stable air and minimal atmospheric interference.",
    photographer: "Sarah Chen"
  },
  {
    id: "rp3",
    name: "Namibia Desert Viewpoint",
    latitude: -24.7275,
    longitude: 15.4061,
    siqs: 9.3,
    description: "One of the darkest skies in Africa, ideal for Milky Way core photography.",
    photographer: "David Astrophoto"
  },
  {
    id: "rp4",
    name: "La Palma Observatory",
    latitude: 28.7636,
    longitude: -17.8916,
    siqs: 9.0,
    description: "Protected dark sky site with excellent conditions for planetary imaging.",
    photographer: "Elena Rodriguez"
  },
  {
    id: "rp5",
    name: "Bryce Canyon National Park",
    latitude: 37.6283,
    longitude: -112.1684,
    siqs: 8.8,
    description: "Clear, dry air and minimal light pollution make this a perfect spot for wide-field Milky Way shots.",
    photographer: "Jonathan Kim"
  },
  {
    id: "rp6",
    name: "Teide Observatory",
    latitude: 28.3,
    longitude: -16.5097,
    siqs: 8.7,
    description: "Located above the cloud layer on Mount Teide, excellent for both deep sky and planetary imaging.",
    photographer: "Maria Gonzalez"
  },
  {
    id: "rp7",
    name: "Death Valley National Park",
    latitude: 36.5323,
    longitude: -116.9325,
    siqs: 8.5,
    description: "Gold-tier Dark Sky Park with extremely low humidity, perfect for galaxy photography.",
    photographer: "Alex Nightscape"
  },
  {
    id: "rp8",
    name: "NamibRand Nature Reserve",
    latitude: -25.0459,
    longitude: 15.9419,
    siqs: 8.9,
    description: "Africa's first International Dark Sky Reserve, offering pristine views of the southern sky.",
    photographer: "Thomas Wright"
  }
];

// Function to calculate distance between two coordinates in km (haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
};

interface RecommendedPhotoPointsProps {
  onSelectPoint: (point: PhotoPoint) => void;
  className?: string;
  userLocation?: { latitude: number; longitude: number } | null;
}

const RecommendedPhotoPoints: React.FC<RecommendedPhotoPointsProps> = ({ 
  onSelectPoint,
  className,
  userLocation
}) => {
  const [recommendedPoints, setRecommendedPoints] = useState<PhotoPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userLocation) {
      setLoading(true);
      // Calculate distance for each point and sort by proximity
      const pointsWithDistance = ALL_RECOMMENDED_POINTS.map(point => ({
        ...point,
        distance: calculateDistance(
          userLocation.latitude, 
          userLocation.longitude, 
          point.latitude, 
          point.longitude
        )
      }));
      
      // Sort by distance (closest first)
      const sortedPoints = pointsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      // Take the closest 4 points
      setRecommendedPoints(sortedPoints.slice(0, 4));
      setLoading(false);
    } else {
      // If no user location, just use the first 4 points from the original array
      setRecommendedPoints(ALL_RECOMMENDED_POINTS.slice(0, 4));
    }
  }, [userLocation]);

  const handleSelectPoint = (point: PhotoPoint) => {
    onSelectPoint(point);
    toast({
      title: "Photo Point Selected",
      description: `Selected ${point.name} by ${point.photographer}`,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Camera className="h-5 w-5 text-primary" />
        Recommended Photo Points
        {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {recommendedPoints.map((point) => (
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
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{point.description}</p>
            <div className="flex justify-between items-center">
              <div className="text-xs text-primary-foreground/70">
                By {point.photographer}
              </div>
              {point.distance && (
                <div className="text-xs font-medium">
                  {point.distance < 100 
                    ? `${Math.round(point.distance)} km away` 
                    : `${Math.round(point.distance / 100) * 100} km away`}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedPhotoPoints;
