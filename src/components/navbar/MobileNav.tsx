
import React from "react";
import { useLocation } from "react-router-dom";
import { Home, Info, MapPin, Share, Telescope } from "lucide-react";
import { MobileNavButton } from "./NavButtons";
import { useLanguage } from "@/contexts/LanguageContext";

interface MobileNavProps {
  location: ReturnType<typeof useLocation>;
  handleSIQSClick: (e: React.MouseEvent) => void;
  locationId: string | null;
}

const MobileNav: React.FC<MobileNavProps> = ({ 
  location, 
  handleSIQSClick, 
  locationId 
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav-bar">
      <div className="flex justify-around items-center py-2">
        <MobileNavButton 
          to="/"
          icon={<Home className="h-5 w-5" />}
          label={t("Home", "首页")}
          active={location.pathname === "/"}
        />
        
        <MobileNavButton
          to={locationId ? `/location/${locationId}` : "/#calculator-section"}
          onClick={handleSIQSClick}
          icon={<MapPin className="h-5 w-5" />}
          label={t("SIQS", "SIQS")}
          active={location.pathname.startsWith('/location/')}
        />
        
        <MobileNavButton
          to="/photo-points"
          icon={<Telescope className="h-5 w-5" />}
          label={t("Photo", "拍摄")}
          active={location.pathname === "/photo-points"}
        />
        
        <MobileNavButton
          to="/about"
          icon={<Info className="h-5 w-5" />}
          label={t("About", "关于")}
          active={location.pathname === "/about"}
        />
        
        <MobileNavButton
          to="/share"
          icon={<Share className="h-5 w-5" />}
          label={t("Share", "分享")}
          active={location.pathname === "/share"}
        />
      </div>
    </div>
  );
};

export default MobileNav;
