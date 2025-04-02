
import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Info, Star } from "lucide-react";
import { siqsToColor } from "@/lib/siqs/utils";
import { formatSIQSScoreForDisplay } from "@/hooks/siqs/siqsCalculationUtils";
import { toast } from "sonner";

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
  if (currentSiqs <= 2) {
    return null;
  }
  
  // Calculate the color for the SIQS value
  const siqsColor = siqsToColor(currentSiqs);
  
  return (
    <div className="mb-4 p-3 rounded-lg glassmorphism bg-cosmic-800/30 border border-cosmic-700/30">
      <div className="flex items-center">
        <Info className="text-primary mr-2 h-5 w-5 flex-shrink-0" />
        <div>
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
        </div>
      </div>
    </div>
  );
};

export default CurrentLocationReminder;
