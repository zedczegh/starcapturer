
import React from "react";
import { Popup } from "react-leaflet";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Props for CommunitySpotPopup:
 * - location: object containing astrospot info and creator info.
 */
interface CommunitySpotPopupProps {
  location: any;
}

/** A custom popup for community astrospots, showing name, SIQS, creator and a profile link */
const CommunitySpotPopup: React.FC<CommunitySpotPopupProps> = ({ location }) => {
  const { t } = useLanguage();

  return (
    <Popup>
      <div className="min-w-[200px] glassmorphism rounded-lg shadow p-2">
        <div className="font-bold text-base mb-1">
          {location.name || t("Unnamed Location", "未命名位置")}
        </div>
        <div className="text-xs text-yellow-600 mb-1">
          SIQS:{" "}
          {typeof location.siqs === "number"
            ? Number(location.siqs).toFixed(1)
            : location.siqs || "N/A"}
        </div>
        <div className="text-xs text-white mb-1">
          {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
        </div>
        <div className="flex items-center gap-1 text-xs text-[#8E9196] mb-2">
          {t("Created by", "创建者")}:
          <a
            href={
              location.creator_id
                ? `/profile?userId=${location.creator_id}`
                : "#"
            }
            className="text-primary underline font-medium hover:opacity-85 transition"
          >
            {location.creator_username || t("Anonymous", "匿名用户")}
          </a>
        </div>
        <div className="text-xs text-gray-200 mb-2 line-clamp-3">{location.description}</div>
        <div className="mt-2 flex justify-end">
          <a
            href={
              location.creator_id
                ? `/profile?userId=${location.creator_id}`
                : "#"
            }
            className="inline-flex gap-1 items-center text-xs px-2 py-1 rounded bg-primary/80 text-primary-foreground font-semibold hover:bg-primary/90 transition"
            aria-label={t("View Profile", "查看资料")}
          >
            {t("View Profile", "查看资料")}
          </a>
        </div>
      </div>
    </Popup>
  );
};

export default CommunitySpotPopup;
