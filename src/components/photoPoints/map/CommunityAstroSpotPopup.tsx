
import React from "react";
import { Popup } from "react-leaflet";
import { Telescope, User2, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useNavigate } from "react-router-dom";

interface CommunityAstroSpotPopupProps {
  spot: SharedAstroSpot & { username?: string };
  onProfile: (spot: SharedAstroSpot & { username?: string }) => void;
}

const CommunityAstroSpotPopup: React.FC<CommunityAstroSpotPopupProps> = ({
  spot,
  onProfile,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <Popup>
      <div className="w-[220px] px-1 py-1.5 marker-popup-gradient rounded shadow">
        <div className="flex items-center gap-2 mb-2">
          <Telescope className="h-4 w-4 text-primary" />
          <div className="font-semibold text-base truncate">{spot.name || t("Unnamed Location", "未命名位置")}</div>
        </div>
        <div className="text-xs text-muted-foreground mb-1">
          <MapPin className="inline-block mr-0.5 h-3 w-3" />
          {spot.latitude?.toFixed(4)}, {spot.longitude?.toFixed(4)}
        </div>
        {typeof spot.bortleScale === "number" && (
          <div className="text-xs text-yellow-600 mb-1">
            {t("Bortle", "博特尔")}: {spot.bortleScale}
            {typeof spot.siqs === "number" &&
              <> &nbsp; SIQS: {Number(spot.siqs).toFixed(1)}</>
            }
          </div>
        )}
        <div className="mb-2 text-xs">{spot.description}</div>
        <div className="mt-2 flex flex-col space-y-1">
          <button
            className="w-full py-1 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 text-white text-xs font-semibold shadow hover:opacity-90 transition"
            onClick={() => {
              onProfile(spot);
              if (spot.username) {
                navigate(`/astrospot-profile/${encodeURIComponent(spot.username)}`);
              }
            }}
          >
            <User2 className="inline mr-1 h-3 w-3 -mt-0.5" />
            {t("View Profile", "查看发布者")}
          </button>
        </div>
      </div>
    </Popup>
  );
};

export default CommunityAstroSpotPopup;
