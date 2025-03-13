import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Info, MapPin, Share, User, MoonStar, Telescope } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchWeatherData, fetchLightPollutionData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { useToast } from "@/hooks/use-toast";

const usePrefetchBeijingData = () => {
  const [beijingData, setBeijingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  useEffect(() => {
    const prefetchData = async () => {
      try {
        const beijing = {
          latitude: 39.9042,
          longitude: 116.4074
        };
        
        const weatherData = await fetchWeatherData({
          latitude: beijing.latitude,
          longitude: beijing.longitude,
        });
        
        if (!weatherData) {
          console.error("Failed to fetch weather data for Beijing");
          return null;
        }
        
        let bortleScale = 7; 
        
        try {
          const bortleData = await fetchLightPollutionData(beijing.latitude, beijing.longitude);
          if (bortleData?.bortleScale) {
            bortleScale = bortleData.bortleScale;
          }
        } catch (error) {
          console.error("Error fetching light pollution data:", error);
          // Continue with default value
        }
        
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const c = 365.25 * year;
        const e = 30.6 * month;
        const jd = c + e + day - 694039.09;
        const moonPhase = (jd % 29.53) / 29.53;
        
        const siqsResult = calculateSIQS({
          cloudCover: weatherData.cloudCover,
          bortleScale: bortleScale,
          seeingConditions: 3, // Average
          windSpeed: weatherData.windSpeed,
          humidity: weatherData.humidity,
          moonPhase,
          aqi: weatherData.aqi,
          weatherCondition: weatherData.weatherCondition
        });
        
        const locationId = "beijing-" + Date.now().toString();
        
        setBeijingData({
          id: locationId,
          name: "Beijing",
          latitude: beijing.latitude,
          longitude: beijing.longitude,
          bortleScale: bortleScale,
          seeingConditions: 3,
          weatherData: weatherData,
          siqsResult,
          moonPhase,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error prefetching Beijing data:", error);
      }
    };
    
    prefetchData();
  }, []);
  
  return { beijingData, isLoading, setIsLoading };
};

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { beijingData, isLoading, setIsLoading } = usePrefetchBeijingData();
  const { toast } = useToast();
  
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
  
  const handleSIQSClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (locationId && location.pathname.startsWith('/location/')) {
      // If we're already on a location page, just stay there
      return;
    }
    
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // If we already have Beijing data cached, use it immediately
      if (beijingData) {
        navigate(`/location/${beijingData.id}`, { 
          state: beijingData,
          replace: false 
        });
        return;
      }
      
      // Default to Beijing coordinates
      const beijing = {
        name: t("Beijing", "北京"),
        latitude: 39.9042,
        longitude: 116.4074
      };
      
      // Attempt to fetch weather data with error handling
      let weatherData;
      try {
        weatherData = await fetchWeatherData({
          latitude: beijing.latitude,
          longitude: beijing.longitude,
        });
      } catch (weatherError) {
        console.error("Failed to fetch weather data:", weatherError);
        // Use fallback values
        weatherData = {
          temperature: 20,
          humidity: 50,
          cloudCover: 30,
          windSpeed: 10,
          precipitation: 0,
          time: new Date().toISOString(),
          condition: "Clear",
          weatherCondition: "Clear",
          aqi: 50
        };
        toast({
          title: t("Using offline data", "使用离线数据"),
          description: t("Could not fetch real-time weather. Using offline data instead.", "无法获取实时天气数据，使用离线数据替代。"),
          variant: "default"
        });
      }
      
      // Default for Beijing (urban area)
      let bortleScale = 7; 
      
      try {
        const bortleData = await fetchLightPollutionData(beijing.latitude, beijing.longitude);
        if (bortleData?.bortleScale) {
          bortleScale = bortleData.bortleScale;
        }
      } catch (error) {
        console.error("Error fetching light pollution data:", error);
        // Continue with default bortle scale
      }
      
      // Calculate moon phase (simplified)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const c = 365.25 * year;
      const e = 30.6 * month;
      const jd = c + e + day - 694039.09;
      const moonPhase = (jd % 29.53) / 29.53;
      
      const siqsResult = calculateSIQS({
        cloudCover: weatherData.cloudCover,
        bortleScale: bortleScale,
        seeingConditions: 3, // Average
        windSpeed: weatherData.windSpeed,
        humidity: weatherData.humidity,
        moonPhase,
        aqi: weatherData.aqi,
        weatherCondition: weatherData.weatherCondition
      });
      
      const locationId = Date.now().toString();
      
      const locationData = {
        id: locationId,
        name: beijing.name,
        latitude: beijing.latitude,
        longitude: beijing.longitude,
        bortleScale: bortleScale,
        seeingConditions: 3,
        weatherData: weatherData,
        siqsResult,
        moonPhase,
        timestamp: new Date().toISOString(),
      };
      
      navigate(`/location/${locationId}`, { 
        state: locationData,
        replace: false 
      });
    } catch (error) {
      console.error("Error navigating to Beijing:", error);
      
      toast({
        title: t("Error", "错误"),
        description: t("Failed to load SIQS data. Redirecting to home.", "加载SIQS数据失败，正在重定向到首页。"),
        variant: "destructive"
      });
      
      // Fallback - just navigate to home calculator section
      navigate('/#calculator-section');
      const calculatorSection = document.getElementById('calculator-section');
      if (calculatorSection) {
        calculatorSection.scrollIntoView({ behavior: 'smooth' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
          scrolled ? "py-2 glassmorphism shadow-lg" : "py-4 bg-transparent"
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
            <Button variant="outline" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{t("Sign In", "登录")}</span>
            </Button>
            <Button>{t("Get Started", "开始使用")}</Button>
          </div>
          
          <div className="flex md:hidden items-center space-x-2">
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav-bar">
        <div className="flex justify-around items-center py-2">
          <MobileNavButton 
            to="/"
            icon={<Home className="h-5 w-5" />}
            label={t("Home", "首页")}
            active={location.pathname === "/"}
          />
          
          <MobileNavButton
            to={locationId ? `/location/${locationId}` : "/#calculator-section"}
            onClick={handleSIQSClick}
            icon={<MapPin className="h-5 w-5" />}
            label={t("SIQS", "SIQS")}
            active={location.pathname.startsWith('/location/')}
          />
          
          <MobileNavButton
            to="/photo-points"
            icon={<Telescope className="h-5 w-5" />}
            label={t("Photo", "拍摄")}
            active={location.pathname === "/photo-points"}
          />
          
          <MobileNavButton
            to="/about"
            icon={<Info className="h-5 w-5" />}
            label={t("About", "关于")}
            active={location.pathname === "/about"}
          />
          
          <MobileNavButton
            to="/share"
            icon={<Share className="h-5 w-5" />}
            label={t("Share", "分享")}
            active={location.pathname === "/share"}
          />
        </div>
      </div>
    </>
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

const MobileNavButton = ({ 
  to, 
  icon, 
  label, 
  active,
  onClick
}: { 
  to: string; 
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center px-3 py-1 mobile-nav-item",
        active ? "active text-primary" : "text-foreground/70"
      )}
    >
      <div className={cn(
        "icon-container p-1.5 rounded-full transition-all",
        active ? "bg-primary/20" : "bg-transparent"
      )}>
        {icon}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
};

export default NavBar;
