import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, MoonStar, User } from "lucide-react";
import MapSelector from "./MapSelector";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const locationId = location.pathname.startsWith('/location/') 
    ? location.pathname.split('/location/')[1] 
    : null;
  
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);
  
  // Force navbar background when menu is open
  const showBackground = scrolled || menuOpen;
  
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  
  const handleSIQSClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (locationId) {
      navigate(`/location/${locationId}`);
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };
  
  const handleLocationSelect = (location: { name: string; latitude: number; longitude: number }) => {
    const locationId = Date.now().toString();
    navigate(`/location/${locationId}`);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
        showBackground ? "py-2 glassmorphism shadow-lg" : "py-4 bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 z-20">
          <MoonStar className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">
            Astro<span className="text-primary">SIQS</span>
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <NavLink to="/" active={location.pathname === "/"}>
            {t("Home", "首页")}
          </NavLink>
          <a
            href={locationId ? `/location/${locationId}` : "/#calculator-section"}
            onClick={handleSIQSClick}
            className={cn(
              "relative text-sm font-medium transition-colors hover:text-primary",
              location.pathname.startsWith('/location/') ? "text-primary" : "text-foreground/70"
            )}
          >
            {t("SIQS Now", "实时SIQS")}
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
          <MapSelector onSelectLocation={handleLocationSelect}>
            <Button variant="ghost" size="icon" title={t("Search Location", "搜索位置")}>
              <Search className="h-5 w-5" />
            </Button>
          </MapSelector>
          <Button variant="outline" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>{t("Sign In", "登录")}</span>
          </Button>
          <Button>{t("Get Started", "开始使用")}</Button>
        </div>
        
        <button 
          className="md:hidden flex items-center z-20"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>
      
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-10 flex flex-col pt-20 mobile-nav-overlay animate-fade-in">
          <div className="container mx-auto px-6 flex flex-col h-full">
            <nav className="flex flex-col space-y-8 py-8">
              <MobileNavLink to="/" onClick={() => setMenuOpen(false)}>
                {t("Home", "首页")}
              </MobileNavLink>
              <a
                href={locationId ? `/location/${locationId}` : "/#calculator-section"}
                onClick={(e) => {
                  handleSIQSClick(e);
                  setMenuOpen(false);
                }}
                className="text-foreground/90 text-xl font-medium py-2 transition-colors hover:text-primary mobile-nav-item"
              >
                {t("SIQS Now", "实时SIQS")}
              </a>
              <MobileNavLink to="/about" onClick={() => setMenuOpen(false)}>
                {t("About SIQS", "关于SIQS")}
              </MobileNavLink>
              <MobileNavLink to="/photo-points" onClick={() => setMenuOpen(false)}>
                {t("Photo Points Nearby", "周边拍摄点")}
              </MobileNavLink>
              <MobileNavLink to="/share" onClick={() => setMenuOpen(false)}>
                {t("Share Location", "分享位置")}
              </MobileNavLink>
            </nav>
            
            <div className="mt-auto space-y-6 pb-8">
              <div className="flex flex-col space-y-4">
                <LanguageSwitcher />
                <MapSelector onSelectLocation={handleLocationSelect}>
                  <Button variant="outline" size="lg" className="w-full flex items-center justify-center space-x-2 mobile-nav-item">
                    <Search className="h-5 w-5" />
                    <span>{t("Search Location", "搜索位置")}</span>
                  </Button>
                </MapSelector>
              </div>
              <div className="pt-4 border-t border-white/10">
                <Button size="lg" className="w-full mobile-nav-item">{t("Sign In", "登录")}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const NavLink = ({ 
  to, 
  active, 
  children 
}: { 
  to: string; 
  active: boolean; 
  children: React.ReactNode 
}) => {
  return (
    <Link
      to={to}
      className={cn(
        "relative text-sm font-medium transition-colors hover:text-primary",
        active ? "text-primary" : "text-foreground/70"
      )}
    >
      {children}
      {active && (
        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
    </Link>
  );
};

const MobileNavLink = ({ 
  to, 
  onClick, 
  children 
}: { 
  to: string; 
  onClick: () => void; 
  children: React.ReactNode 
}) => {
  return (
    <Link
      to={to}
      className="text-foreground/90 text-xl font-medium py-2 transition-colors hover:text-primary mobile-nav-item"
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

export default NavBar;
