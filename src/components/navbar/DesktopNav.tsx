
import React from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "./NavButtons";
import SiqsNavButton from "./SiqsNavButton";
import LanguageSwitcher from "../LanguageSwitcher";
import ProfileButton from "./ProfileButton";
import LocationPinButton from "./LocationPinButton";

interface DesktopNavProps {
  location: ReturnType<typeof useLocation>;
  locationId: string | null;
  isMobile?: boolean;
  onNavClick?: () => void;
}

const DesktopNav: React.FC<DesktopNavProps> = ({
  location,
  locationId,
  isMobile = false,
  onNavClick
}) => {
  const { t } = useLanguage();
  const currentPath = location.pathname;
  
  const handleClick = () => {
    if (onNavClick) onNavClick();
  };
  
  return (
    <div className={`flex ${isMobile ? 'flex-col space-y-6' : 'items-center space-x-5'}`}>
      <div className={`flex ${isMobile ? 'flex-col space-y-6 items-start' : 'items-center space-x-5'}`}>
        <NavLink 
          to="/" 
          active={currentPath === "/"} 
          onClick={handleClick}
        >
          {t("Home", "首页")}
        </NavLink>
        
        <NavLink 
          to="/photo-points" 
          active={currentPath === "/photo-points"} 
          onClick={handleClick}
        >
          {t("Photo Points", "拍摄点")}
        </NavLink>
        
        <NavLink 
          to="/community" 
          active={currentPath === "/community"} 
          onClick={handleClick}
        >
          {t("Community", "社区")}
        </NavLink>
        
        <SiqsNavButton 
          currentPath={currentPath} 
          locationId={locationId}
          onClick={handleClick}
        />
        
        <NavLink 
          to="/messages" 
          active={currentPath === "/messages"} 
          onClick={handleClick}
        >
          {t("Messages", "消息")}
        </NavLink>
        
        <NavLink 
          to="/useful-links" 
          active={currentPath === "/useful-links"} 
          onClick={handleClick}
        >
          {t("Resources", "资源")}
        </NavLink>
      </div>
      
      {isMobile && (
        <div className="flex flex-col space-y-6 pt-6 border-t border-cosmic-800/50 w-full">
          <div className="flex items-center space-x-4">
            <LocationPinButton />
            <LanguageSwitcher />
          </div>
          <ProfileButton />
        </div>
      )}
      
      {!isMobile && (
        <div className="hidden md:flex items-center space-x-4">
          <LocationPinButton />
          <LanguageSwitcher />
          <ProfileButton />
        </div>
      )}
    </div>
  );
};

export default DesktopNav;
