
import React from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { MapPin, Home, Info, Users, CameraIcon, Star } from "lucide-react";

interface DesktopNavProps {
  location: any;
  locationId: string | null;
  savedLocation?: any;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ location, locationId, savedLocation }) => {
  const { t } = useLanguage();
  
  // Generate the location link with appropriate state data
  const getLocationLink = () => {
    // If we have saved location data, use it
    if (savedLocation) {
      return {
        pathname: `/location/${savedLocation.id || 'latest'}`,
        state: {
          ...savedLocation,
          fromNavBar: true
        }
      };
    }
    
    // Fallback to default route
    return "/location";
  };

  return (
    <div className="hidden md:flex items-center space-x-1">
      <NavLink
        to="/"
        className={({ isActive }) =>
          cn(
            "px-3 py-1.5 rounded-md text-sm font-medium flex items-center",
            isActive
              ? "bg-cosmic-800 text-white"
              : "text-gray-300 hover:bg-cosmic-800/40 hover:text-white transition-colors"
          )
        }
      >
        <Home className="w-4 h-4 mr-1.5" />
        {t("Home", "主页")}
      </NavLink>

      <NavLink
        to={getLocationLink()}
        className={({ isActive }) =>
          cn(
            "px-3 py-1.5 rounded-md text-sm font-medium flex items-center",
            isActive || location.pathname.startsWith("/location/")
              ? "bg-cosmic-800 text-white"
              : "text-gray-300 hover:bg-cosmic-800/40 hover:text-white transition-colors"
          )
        }
      >
        <MapPin className="w-4 h-4 mr-1.5" />
        {t("Location", "位置")}
      </NavLink>

      <NavLink
        to="/community"
        className={({ isActive }) =>
          cn(
            "px-3 py-1.5 rounded-md text-sm font-medium flex items-center",
            isActive || location.pathname.startsWith("/astro-spot/")
              ? "bg-cosmic-800 text-white"
              : "text-gray-300 hover:bg-cosmic-800/40 hover:text-white transition-colors"
          )
        }
      >
        <Users className="w-4 h-4 mr-1.5" />
        {t("Community", "社区")}
      </NavLink>

      <NavLink
        to="/bortle-now"
        className={({ isActive }) =>
          cn(
            "px-3 py-1.5 rounded-md text-sm font-medium flex items-center",
            isActive
              ? "bg-cosmic-800 text-white"
              : "text-gray-300 hover:bg-cosmic-800/40 hover:text-white transition-colors"
          )
        }
      >
        <CameraIcon className="w-4 h-4 mr-1.5" />
        {t("BortleNow", "光害测量")}
      </NavLink>

      <NavLink
        to="/about"
        className={({ isActive }) =>
          cn(
            "px-3 py-1.5 rounded-md text-sm font-medium flex items-center",
            isActive
              ? "bg-cosmic-800 text-white"
              : "text-gray-300 hover:bg-cosmic-800/40 hover:text-white transition-colors"
          )
        }
      >
        <Info className="w-4 h-4 mr-1.5" />
        {t("About", "关于")}
      </NavLink>
    </div>
  );
};

export default DesktopNav;
