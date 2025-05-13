
import React, { useState, useEffect } from "react";
import { Link, Location } from "react-router-dom";
import { Menu, X, Home, MapPin, Search, Users, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

interface MobileNavProps {
  location: Location;
  locationId: string | null;
  isCurrentLocationView?: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ location, locationId, isCurrentLocationView }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  
  // Hide menu on route change
  useEffect(() => {
    setShowMenu(false);
  }, [location.pathname]);
  
  // Current route pathname
  const currentPath = location.pathname;
  
  // Mobile navigation icons and labels
  const navItems = [
    { path: "/", label: t("Home", "首页"), icon: Home },
    { path: "/explore", label: t("Explore", "探索"), icon: Search },
    { path: "/location/default", label: t("My Location", "我的位置"), icon: MapPin },
    { path: "/community", label: t("Community", "社区"), icon: Users },
  ];
  
  // Add profile if user is logged in
  if (user) {
    navItems.push({ 
      path: `/profile/${user.id}`, 
      label: t("Profile", "个人资料"), 
      icon: User 
    });
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-cosmic-900/80 backdrop-blur-lg border-t border-cosmic-700/50 md:hidden z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = 
              currentPath === item.path || 
              (item.path === '/location/default' && currentPath.startsWith('/location/'));
              
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors
                  ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-300'}`}
              >
                <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-primary' : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Mobile Menu Button (removed from main navigation) */}
      {false && (
        <button
          onClick={() => setShowMenu(true)}
          className="flex md:hidden items-center text-gray-300 focus:outline-none"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}
      
      {/* Full Screen Mobile Menu */}
      {showMenu && (
        <div className="fixed inset-0 bg-cosmic-900 z-50 md:hidden">
          <div className="flex justify-end p-4">
            <button
              onClick={() => setShowMenu(false)}
              className="text-gray-300 focus:outline-none"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-center space-y-6 h-full">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-xl font-medium ${
                  currentPath === item.path ? 'text-primary' : 'text-gray-300'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;
