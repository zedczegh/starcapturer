
import React from "react";
import { useLocation } from "react-router-dom";
import { Telescope, Map, Smartphone, Users } from "lucide-react";
import { MobileNavButton } from "./NavButtons";
import { useLanguage } from "@/contexts/LanguageContext";

interface MobileNavProps {
  location: ReturnType<typeof useLocation>;
  locationId: string | null;
}

const MobileNav: React.FC<MobileNavProps> = ({
  location,
  locationId
}) => {
  const { t } = useLanguage();

  // Use a default location ID for when there isn't one
  const detailsPath = locationId ? `/location/${locationId}` : '/location/default';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav-bar">
      <div className="flex justify-around items-center py-2 px-2 bg-[#0f172a]/[0.90] backdrop-blur-xl border-t border-cosmic-600/15 shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
        <MobileNavButton 
          to="/photo-points" 
          icon={<Telescope className="h-5 w-5 stroke-[1.5]" />} 
          label={t("Photo", "拍摄")} 
          active={location.pathname === "/photo-points"} 
        />
        
        <MobileNavButton 
          to={detailsPath}
          icon={<Map className="h-5 w-5 stroke-[1.5]" />} 
          label={t("Location", "位置")} 
          active={location.pathname.startsWith('/location/')} 
        />

        <MobileNavButton
          to="/community"
          icon={<Users className="h-5 w-5 stroke-[1.5]" />}
          label={t("Community", "社区")}
          active={location.pathname === "/community"}
        />

        <MobileNavButton 
          to="/share" 
          icon={<Smartphone className="h-5 w-5 stroke-[1.5]" />} 
          label={t("Bortle", "光污染")} 
          active={location.pathname === "/share"} 
        />
      </div>
    </div>
  );
};

export default MobileNav;
