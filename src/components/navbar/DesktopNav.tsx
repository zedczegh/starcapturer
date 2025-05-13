
import React from "react";
import { Link, useLocation, Location } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import ProfileButton from "./ProfileButton";

interface DesktopNavProps {
  location: Location;
  locationId: string | null;
  isCurrentLocationView?: boolean;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ location, locationId, isCurrentLocationView }) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  
  // Current route pathname
  const currentPath = location.pathname;

  // List of available navigation links
  const navLinks = [
    { path: '/', label: t('Home', '首页') },
    { path: '/explore', label: t('Explore', '探索') },
    // Use /location/default to always show current location
    { path: '/location/default', label: t('My Location', '我的位置') },
    { path: '/community', label: t('Community', '社区') },
    { path: `/profile/${user?.id}`, label: t('Profile', '个人资料'), requireAuth: true }
  ];

  // Only show links that don't require auth or user is authenticated
  const filteredLinks = navLinks.filter(link => !link.requireAuth || user);

  return (
    <div className="hidden md:flex items-center justify-between w-full">
      <div className="flex items-center space-x-6">
        {filteredLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-sm font-medium transition-colors hover:text-primary relative
              ${(currentPath === link.path || 
                (link.path === '/location/default' && currentPath.startsWith('/location/'))) 
                ? 'text-primary' 
                : 'text-cosmic-100'}`}
          >
            {link.label}
            
            {/* Highlight indicator for active link */}
            {(currentPath === link.path || 
              (link.path === '/location/default' && currentPath.startsWith('/location/'))) && (
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        ))}
      </div>
      
      {/* Profile button for logged in users */}
      {user && (
        <div className="flex items-center">
          <ProfileButton />
        </div>
      )}
    </div>
  );
};

export default DesktopNav;
