
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Menu, X, MapPin, Home, Info, Users, CameraIcon } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface MobileNavProps {
  location: any;
  locationId: string | null;
  savedLocation?: any;
}

const MobileNav: React.FC<MobileNavProps> = ({ location, locationId, savedLocation }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-cosmic-900/95 border-t border-cosmic-700/30 backdrop-blur-md">
      <div className="flex justify-around items-center h-14">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center justify-center h-full",
              isActive ? "text-primary" : "text-gray-400 hover:text-primary"
            )
          }
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">{t("Home", "主页")}</span>
        </NavLink>

        <NavLink
          to={getLocationLink()}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center justify-center h-full",
              isActive || location.pathname.startsWith("/location/")
                ? "text-primary"
                : "text-gray-400 hover:text-primary"
            )
          }
        >
          <MapPin className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">{t("Location", "位置")}</span>
        </NavLink>

        <NavLink
          to="/community"
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center justify-center h-full",
              isActive || location.pathname.startsWith("/astro-spot/")
                ? "text-primary"
                : "text-gray-400 hover:text-primary"
            )
          }
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">{t("Community", "社区")}</span>
        </NavLink>

        <NavLink
          to="/bortle-now"
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center justify-center h-full",
              isActive ? "text-primary" : "text-gray-400 hover:text-primary"
            )
          }
        >
          <CameraIcon className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">{t("BortleNow", "光害")}</span>
        </NavLink>

        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-1 flex-col items-center justify-center h-full text-gray-400 hover:text-primary"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">{t("More", "更多")}</span>
        </button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="bg-cosmic-900 border-cosmic-700">
          <div className="flex flex-col space-y-4 pt-8">
            <NavLink
              to="/about"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-4 py-2 rounded-md",
                  isActive ? "bg-cosmic-800 text-white" : "text-gray-300 hover:bg-cosmic-800/40"
                )
              }
            >
              <Info className="h-5 w-5 mr-3" />
              {t("About", "关于")}
            </NavLink>
            
            {/* Add any additional links for the mobile menu here */}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNav;
