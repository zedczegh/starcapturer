
import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Info, Star, CloudRain, MapPin } from "lucide-react";
import { siqsToColor } from "@/lib/siqs/utils";
import { formatSIQSScoreForDisplay } from "@/hooks/siqs/siqsCalculationUtils";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface CurrentLocationReminderProps {
  currentSiqs: number | null;
  isVisible?: boolean;
}

const CurrentLocationReminder: React.FC<CurrentLocationReminderProps> = ({
  currentSiqs,
  isVisible = true,
}) => {
  const { t } = useLanguage();
  const [hasShownToast, setHasShownToast] = useState(false);
  
  // Determine if we should show the high SIQS notification
  const showHighSiqsNotification = currentSiqs !== null && currentSiqs > 3;
  
  // Determine if we should show the low SIQS encouragement
  const showLowSiqsEncouragement = currentSiqs !== null && currentSiqs <= 1.5;
  
  // Show a toast notification if SIQS is over 3 and we haven't shown it yet
  useEffect(() => {
    if (showHighSiqsNotification && !hasShownToast) {
      toast.info(
        t(
          "Your current location is ideal for astrophotography tonight, please find a rural spot with lower light pollution to start imaging!",
          "您当前的位置今晚非常适合天文摄影，请寻找光污染较少的乡村地点开始拍摄！"
        ),
        {
          duration: 8000,
          icon: <Star className="text-yellow-400" />,
        }
      );
      setHasShownToast(true);
    }
  }, [showHighSiqsNotification, hasShownToast, t]);
  
  // If component is not visible or no SIQS data, don't render
  if (!isVisible || currentSiqs === null) {
    return null;
  }
  
  // Don't show the box for low SIQS scores, only the toast for high scores
  if (currentSiqs > 1.5 && currentSiqs <= 2) {
    return null;
  }
  
  // Calculate the color for the SIQS value
  const siqsColor = siqsToColor(currentSiqs);
  
  return (
    <div className="mb-4 p-3 rounded-lg glassmorphism bg-cosmic-800/30 border border-cosmic-700/30">
      <div className="flex items-center">
        {showLowSiqsEncouragement ? (
          <CloudRain className="text-blue-400 mr-2 h-5 w-5 flex-shrink-0" />
        ) : (
          <Info className="text-primary mr-2 h-5 w-5 flex-shrink-0" />
        )}
        <div className="space-y-2 w-full">
          <p className="text-sm">
            {showHighSiqsNotification ? (
              <span>
                {t(
                  "Your current location has a good SIQS score of ",
                  "您当前位置的SIQS评分不错，为 "
                )}
                <span
                  className="font-semibold"
                  style={{ color: siqsColor }}
                >
                  {formatSIQSScoreForDisplay(currentSiqs)}
                </span>
                {t(
                  ". For best results, consider a rural location with lower light pollution.",
                  "。为获得最佳效果，请考虑光污染较少的乡村地点。"
                )}
              </span>
            ) : showLowSiqsEncouragement ? (
              <span>
                {t(
                  "Current conditions aren't ideal with a SIQS score of ",
                  "当前条件不太理想，SIQS评分为 "
                )}
                <span
                  className="font-semibold"
                  style={{ color: siqsColor }}
                >
                  {formatSIQSScoreForDisplay(currentSiqs)}
                </span>
                {t(
                  ". Don't worry, the clear skies will eventually come! Try our Photo Points feature to find better spots nearby.",
                  "。别担心，晴朗的天空终会到来！尝试我们的拍摄点功能来寻找附近更好的地点。"
                )}
              </span>
            ) : (
              <span>
                {t(
                  "Your current location has a SIQS score of ",
                  "您当前位置的SIQS评分为 "
                )}
                <span
                  className="font-semibold"
                  style={{ color: siqsColor }}
                >
                  {formatSIQSScoreForDisplay(currentSiqs)}
                </span>
                {t(
                  ". Please check our recommended locations for better viewing conditions.",
                  "。请查看我们推荐的位置以获得更好的观测条件。"
                )}
              </span>
            )}
          </p>
          
          {showLowSiqsEncouragement && (
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-1 text-sm bg-primary/10 border-primary/20 hover:bg-primary/20"
                asChild
              >
                <Link to="/photo-points">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  {t("Find Nearby Photo Points", "查找附近拍摄点")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentLocationReminder;
