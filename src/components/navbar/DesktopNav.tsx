
import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useSiqsNavigation } from "@/hooks/navigation/useSiqsNavigation";
import { useBeijingData } from "./useBeijingData";

interface DesktopNavProps {
  location: {
    pathname: string;
  };
  locationId?: string | null;
  isHomepage?: boolean;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ location, locationId, isHomepage = false }) => {
  const { t } = useLanguage();
  const { handleSIQSClick } = useSiqsNavigation();
  const { beijingLocations, beijingNames } = useBeijingData();
  
  // On homepage, handle navigation differently
  const isLocationPage = locationId || isHomepage;
  
  return (
    <>
      <div className="flex items-center">
        <Link to="/" className="flex items-center mr-6">
          <span className="text-xl font-semibold text-white">SIQS</span>
        </Link>
        
        <nav className="hidden md:flex space-x-4">
          <Button
            variant={isLocationPage ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/">
              <MapPin className="w-4 h-4 mr-1" />
              {t("Location", "位置")}
            </Link>
          </Button>
          
          <Button
            variant={location.pathname === "/photo-points" ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/photo-points">
              {t("Photo Points", "摄影点")}
            </Link>
          </Button>
          
          <Button
            variant={location.pathname === "/about" ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/about">
              {t("About", "关于")}
            </Link>
          </Button>
        </nav>
      </div>
      
      <div className="flex items-center space-x-2">
        <LanguageSwitcher />
      </div>
    </>
  );
};

export default DesktopNav;
