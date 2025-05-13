
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import NavHeader from "../navbar/NavHeader";
import DesktopNav from "../navbar/DesktopNav";
import MobileNav from "../navbar/MobileNav";
import ProfileButton from "../navbar/ProfileButton";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  const locationId = location.pathname.startsWith('/location/') 
    ? location.pathname.split('/location/')[1] 
    : null;

  // Update locationId handling to detect "default" as a special case for always using current location
  const isCurrentLocationView = locationId === "default" || (location.state && location.state.fromCurrentLocation);

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

  // Use a higher z-index to ensure the navbar is visible on all pages
  return (
    <>
      <NavHeader scrolled={scrolled}>
        <DesktopNav 
          location={location} 
          locationId={locationId}
          isCurrentLocationView={isCurrentLocationView}
        />
        <div className="flex md:hidden items-center">
          <ProfileButton />
        </div>
      </NavHeader>
      
      <MobileNav 
        location={location} 
        locationId={locationId}
        isCurrentLocationView={isCurrentLocationView}
      />
    </>
  );
};

export default NavBar;
