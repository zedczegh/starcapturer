
import React from "react";
import { Link } from "react-router-dom";
import { MapPin, NavigationIcon, Share2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateBaiduMapsUrl, SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface PhotoLocationCardProps {
  point: SharedAstroSpot;
  index: number;
  currentSiqs?: number | null;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ point, index, currentSiqs }) => {
  const { t } = useLanguage();
  
  const formatDistance = (distance?: number) => {
    if (distance === undefined) return t("Unknown distance", "未知距离");
    
    if (distance < 1) 
      return t(`${Math.round(distance * 1000)} m away`, `距离 ${Math.round(distance * 1000)} 米`);
    if (distance < 100) 
      return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
    return t(`${Math.round(distance / 10) * 10} km away`, `距离 ${Math.round(distance / 10) * 10} 公里`);
  };
  
  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default link behavior
    window.open(generateBaiduMapsUrl(point.latitude, point.longitude, point.name), '_blank');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default link behavior
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: t(`Astrophotography Spot: ${point.name}`, `天文摄影点：${point.name}`),
        text: t(
          `Check out this amazing astrophotography location: ${point.name}. SIQS: ${point.siqs?.toFixed(1) || "N/A"}`,
          `看看这个绝佳的天文摄影地点: ${point.name}. SIQS评分: ${point.siqs?.toFixed(1) || "N/A"}`
        ),
        url: window.location.origin + `/location/${point.id}`,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback to copying to clipboard
      const shareUrl = window.location.origin + `/location/${point.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success(t("Link Copied", "链接已复制"), {
          description: t("Location link copied to clipboard!", "位置链接已复制到剪贴板！"),
        });
      });
    }
  };
  
  // Calculate whether this has significantly higher SIQS than current location
  const isSignificantlyBetter = currentSiqs !== null && point.siqs && point.siqs > (currentSiqs + 2);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Link 
        to={`/location/${point.id}`}
        className={`glassmorphism p-4 rounded-lg hover:bg-background/50 transition-colors flex flex-col h-full
                    ${isSignificantlyBetter ? 'border-2 border-primary/40' : ''}`}
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
          <motion.div 
            className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded"
            whileHover={{ scale: 1.05 }}
            animate={isSignificantlyBetter ? { 
              scale: [1, 1.05, 1],
              transition: { repeat: Infinity, duration: 2 }
            } : {}}
          >
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            <span className="font-medium text-sm">{point.siqs?.toFixed(1) || "N/A"}</span>
          </motion.div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow">
          {point.description}
        </p>
        
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs text-primary-foreground/70">
            {t("By", "拍摄者：")} {point.photographer || t("Unknown", "未知")}
          </div>
          {point.distance !== undefined && (
            <div className="text-xs font-medium bg-background/30 px-2 py-1 rounded-full">
              {formatDistance(point.distance)}
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
                  onClick={handleNavigate}
                >
                  <NavigationIcon className="h-3.5 w-3.5 mr-1.5" />
                  {t("Navigate", "导航")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("Get directions to this location", "获取到此位置的导航")}</p>
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
                  onClick={handleShare}
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  {t("Share", "分享")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("Share this location with others", "与他人分享此位置")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Link>
    </motion.div>
  );
};

export default PhotoLocationCard;
