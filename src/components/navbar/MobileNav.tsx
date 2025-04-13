
import React from "react";
import { useLocation } from "react-router-dom";
import { Home, Info, Telescope, Smartphone, Link2 } from "lucide-react";
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
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav-bar">
      <div className="flex justify-around items-center py-3 px-2 bg-[#123341]/[0.84] backdrop-blur-xl border-t border-cosmic-100/10">
        <MobileNavButton to="/" icon={<Home className="h-5 w-5" />} label={t("Home", "首页")} active={location.pathname === "/"} />
        
        <MobileNavButton to="/share" icon={<Smartphone className="h-5 w-5" />} label={t("Bortle", "光污染")} active={location.pathname === "/share"} />
        
        <MobileNavButton to="/photo-points" icon={<Telescope className="h-5 w-5" />} label={t("Photo", "拍摄")} active={location.pathname === "/photo-points"} />
        
        <MobileNavButton to="/about" icon={<Info className="h-5 w-5" />} label={t("About", "关于")} active={location.pathname === "/about"} />
        
        <MobileNavButton to="/useful-links" icon={<Link2 className="h-5 w-5" />} label={t("Links", "资源")} active={location.pathname === "/useful-links"} />
      </div>
    </div>
  );
};

export default MobileNav;
