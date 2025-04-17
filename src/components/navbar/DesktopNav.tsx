
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { NavLink } from "./NavButtons";
import LanguageSwitcher from "../LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Map } from "lucide-react";

interface DesktopNavProps {
  location: ReturnType<typeof useLocation>;
  locationId: string | null;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ 
  location, 
  locationId 
}) => {
  const { t } = useLanguage();
  
  return (
    <>
      <nav className="hidden md:flex items-center space-x-6">
        <NavLink to="/" active={location.pathname === "/"}>
          {t("Home", "首页")}
        </NavLink>
        <NavLink to="/about" active={location.pathname === "/about"}>
          {t("About SIQS", "关于SIQS")}
        </NavLink>
        <NavLink to="/photo-points" active={location.pathname === "/photo-points"}>
          {t("Photo Points", "拍摄点")}
        </NavLink>
        <NavLink to="/useful-links" active={location.pathname === "/useful-links"}>
          {t("Resources", "资源")}
        </NavLink>
        <NavLink to="/share" active={location.pathname === "/share"}>
          {t("Bortle Now", "实时光污染")}
        </NavLink>
        {locationId && (
          <NavLink 
            to={`/location/${locationId}`} 
            active={location.pathname === `/location/${locationId}`}
          >
            {t("Location Details", "位置详情")}
          </NavLink>
        )}
      </nav>
      
      <div className="hidden md:flex items-center">
        <LanguageSwitcher />
      </div>
    </>
  );
};

export default DesktopNav;
