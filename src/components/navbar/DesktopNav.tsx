
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { NavLink } from "./NavButtons";
import LanguageSwitcher from "../LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Map } from "lucide-react";
import UtilitiesButton from "./UtilitiesButton";
import ProfileButton from "./ProfileButton";

interface DesktopNavProps {
  location: ReturnType<typeof useLocation>;
  locationId: string | null;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ 
  location, 
  locationId 
}) => {
  const { t } = useLanguage();
  
  const detailsPath = locationId ? `/location/${locationId}` : '/location/default';
  
  return (
    <>
      <nav className="hidden md:flex items-center space-x-6">
        <NavLink to="/" active={location.pathname === "/"}>
          {t("Community", "社区")}
        </NavLink>
        <NavLink to="/photo-points" active={location.pathname === "/photo-points"}>
          {t("Photo Points", "拍摄点")}
        </NavLink>
        <NavLink 
          to={detailsPath}
          active={location.pathname.startsWith('/location/')}
        >
          {t("Location Details", "位置详情")}
        </NavLink>
      </nav>
      
      <div className="hidden md:flex items-center space-x-2">
        <UtilitiesButton />
        <LanguageSwitcher />
        <ProfileButton />
      </div>
    </>
  );
};

export default DesktopNav;
