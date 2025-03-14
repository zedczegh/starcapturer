
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { NavLink } from "./NavButtons";
import LanguageSwitcher from "../LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiqsNavigation } from "@/hooks/navigation/useSiqsNavigation";

interface DesktopNavProps {
  location: ReturnType<typeof useLocation>;
  locationId: string | null;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ 
  location, 
  locationId 
}) => {
  const { t } = useLanguage();
  const { handleSIQSClick } = useSiqsNavigation();
  
  return (
    <>
      <nav className="hidden md:flex items-center space-x-6">
        <NavLink to="/" active={location.pathname === "/"}>
          {t("Home", "首页")}
        </NavLink>
        <a
          href="/#calculator-section"
          onClick={handleSIQSClick}
          className="relative text-sm font-medium transition-colors hover:text-primary"
          style={{ 
            color: location.pathname.startsWith('/location/') 
              ? 'var(--primary)' 
              : 'var(--foreground, #999)'
          }}
        >
          {t("SIQS Now", "实时SIQS")}
          {location.pathname.startsWith('/location/') && (
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </a>
        <NavLink to="/about" active={location.pathname === "/about"}>
          {t("About SIQS", "关于SIQS")}
        </NavLink>
        <NavLink to="/photo-points" active={location.pathname === "/photo-points"}>
          {t("Photo Points Nearby", "周边拍摄点")}
        </NavLink>
        <NavLink to="/share" active={location.pathname === "/share"}>
          {t("Share Location", "分享位置")}
        </NavLink>
      </nav>
      
      <div className="hidden md:flex items-center space-x-2">
        <LanguageSwitcher />
        <Button variant="outline" className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span>{t("Sign In", "登录")}</span>
        </Button>
        <Button>{t("Get Started", "开始使用")}</Button>
      </div>
    </>
  );
};

export default DesktopNav;
