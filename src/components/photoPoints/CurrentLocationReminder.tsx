
import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Info, Star, CloudMoonRain } from "lucide-react";
import { siqsToColor } from "@/lib/siqs/utils";
import { formatSIQSScoreForDisplay } from "@/hooks/siqs/siqsCalculationUtils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface CurrentLocationReminderProps {
  currentSiqs: number | null;
  isVisible?: boolean;
  encouragementMessage?: string | null;
}

const CurrentLocationReminder: React.FC<CurrentLocationReminderProps> = ({
  currentSiqs,
  isVisible = true,
  encouragementMessage = null
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
  
  // If poor conditions and we have an encouragement message
  const isPoorConditions = currentSiqs <= 2;
  
  // Calculate the color for the SIQS value
  const siqsColor = siqsToColor(currentSiqs);
  
  return (
    <div className="mb-4 p-3 rounded-lg glassmorphism bg-cosmic-800/30 border border-cosmic-700/30">
      <div className="flex items-center">
        {isPoorConditions && encouragementMessage ? (
          <CloudMoonRain className="text-blue-400 mr-2 h-5 w-5 flex-shrink-0" />
        ) : (
          <Info className="text-primary mr-2 h-5 w-5 flex-shrink-0" />
        )}
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
            ) : isPoorConditions && encouragementMessage ? (
              <span>
                {t(
                  encouragementMessage,
                  "不要担心，晴朗的天空终会到来！尝试使用我们的"附近观测点"功能寻找理想的天文摄影地点！"
                )}
                <Link to="/photo-points" className="ml-1 underline text-blue-300 hover:text-blue-200">
                  {t("Find photo points", "查找观测点")} →
                </Link>
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
