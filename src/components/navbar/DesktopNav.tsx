
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { MapPin, Info, Globe, MapPinned } from 'lucide-react';

interface DesktopNavProps {
  location: {
    pathname: string;
  };
  locationId: string | null;
}

const DesktopNav = ({ location, locationId }: DesktopNavProps) => {
  const { t } = useLanguage();

  // Navigation links data
  const navLinks = [
    {
      name: t("My Location", "我的位置"),
      path: "/location",
      icon: <MapPin className="h-4 w-4 mr-1" />,
      exact: true
    },
    {
      name: t("Photo Points", "拍摄点"),
      path: "/photo-points",
      icon: <MapPinned className="h-4 w-4 mr-1" />
    },
    {
      name: t("World Map", "世界地图"),
      path: "/world-map",
      icon: <Globe className="h-4 w-4 mr-1" />
    },
    {
      name: t("About", "关于"),
      path: "/about",
      icon: <Info className="h-4 w-4 mr-1" />
    }
  ];

  return (
    <nav className="hidden md:flex md:items-center">
      <ul className="flex space-x-1">
        {navLinks.map((link) => (
          <li key={link.path}>
            <NavLink
              to={link.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-md",
                  (isActive || 
                   (link.path === "/location" && location.pathname.startsWith("/location/")))
                    ? "text-primary-foreground bg-primary/10 hover:bg-primary/15"
                    : "text-muted-foreground hover:text-foreground hover:bg-cosmic-800/50"
                )
              }
            >
              {link.icon}
              {link.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default DesktopNav;
