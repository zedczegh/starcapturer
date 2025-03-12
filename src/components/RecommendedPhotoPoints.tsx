
import React from "react";
import { Button } from "@/components/ui/button";
import { Camera, Star } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface PhotoPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  siqs: number;
  description: string;
  photographer: string;
}

// Sample data from real astrophotographers
const RECOMMENDED_POINTS: PhotoPoint[] = [
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
  }
];

interface RecommendedPhotoPointsProps {
  onSelectPoint: (point: PhotoPoint) => void;
  className?: string;
}

const RecommendedPhotoPoints: React.FC<RecommendedPhotoPointsProps> = ({ 
  onSelectPoint,
  className 
}) => {
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
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {RECOMMENDED_POINTS.map((point) => (
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
            <div className="text-xs text-primary-foreground/70">
              By {point.photographer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedPhotoPoints;
