
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Menu, X, MapPin, Info, Globe, MapPinned } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavProps {
  location: {
    pathname: string;
  };
  locationId: string | null;
}

const MobileNav = ({ location, locationId }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  // Navigation links data
  const navLinks = [
    {
      name: t("My Location", "我的位置"),
      path: "/location",
      icon: <MapPin className="h-5 w-5 mr-2" />
    },
    {
      name: t("Photo Points", "拍摄点"),
      path: "/photo-points",
      icon: <MapPinned className="h-5 w-5 mr-2" />
    },
    {
      name: t("World Map", "世界地图"),
      path: "/world-map",
      icon: <Globe className="h-5 w-5 mr-2" />
    },
    {
      name: t("About", "关于"),
      path: "/about",
      icon: <Info className="h-5 w-5 mr-2" />
    }
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 z-40 w-full md:hidden">
        <div className="grid grid-cols-4 bg-cosmic-900/95 border-t border-cosmic-800/50">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center py-3 text-xs",
                  (isActive || 
                   (link.path === "/location" && location.pathname.startsWith("/location/")))
                    ? "text-primary"
                    : "text-muted-foreground"
                )
              }
              onClick={() => setIsOpen(false)}
            >
              {React.cloneElement(link.icon, { 
                className: "h-5 w-5 mb-1" 
              })}
              <span className="text-[10px]">{link.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileNav;
