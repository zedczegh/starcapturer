
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
      <div className="relative flex justify-around items-center py-3 px-3 bg-gradient-to-t from-slate-900/95 via-slate-800/90 to-slate-700/85 backdrop-blur-xl border-t border-cyan-500/20 shadow-[0_-4px_20px_rgba(6,182,212,0.1)]">
        {/* Glacial overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-sky-500/5 pointer-events-none" />
        
        <MobileNavButton
          to="/"
          icon={<Users className="h-5 w-5 stroke-[1.5]" />}
          label={t("Community", "社区")}
          active={location.pathname === "/"}
        />
        
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
