
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import NavHeader from "./navbar/NavHeader";
import DesktopNav from "./navbar/DesktopNav";
import MobileNav from "./navbar/MobileNav";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
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

  // Make sure navbar appears on all pages, including details page
  return (
    <>
      <NavHeader scrolled={scrolled}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <DesktopNav 
            location={location} 
            locationId={locationId}
          />
        </div>
      </NavHeader>
      
      <MobileNav 
        location={location} 
        locationId={locationId}
      />
    </>
  );
};

export default NavBar;
