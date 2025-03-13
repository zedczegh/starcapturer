
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePrefetchBeijingData } from "./navbar/useBeijingData";
import { useNavigation } from "./navbar/useNavigation";
import NavHeader from "./navbar/NavHeader";
import DesktopNav from "./navbar/DesktopNav";
import MobileNav from "./navbar/MobileNav";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { beijingData, isLoading, setIsLoading } = usePrefetchBeijingData();
  
  const locationId = location.pathname.startsWith('/location/') 
    ? location.pathname.split('/location/')[1] 
    : null;
  
  const { handleSIQSClick } = useNavigation(locationId, beijingData, isLoading, setIsLoading);

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

  return (
    <>
      <NavHeader scrolled={scrolled}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <DesktopNav 
            location={location} 
            handleSIQSClick={handleSIQSClick}
            locationId={locationId}
          />
        </div>
      </NavHeader>
      
      <MobileNav 
        location={location} 
        handleSIQSClick={handleSIQSClick}
        locationId={locationId}
      />
    </>
  );
};

export default NavBar;
