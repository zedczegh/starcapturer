
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import NavHeader from "./navbar/NavHeader";
import DesktopNav from "./navbar/DesktopNav";
import MobileNav from "./navbar/MobileNav";
import ProfileButton from "./navbar/ProfileButton";
import { motion } from "framer-motion";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  const locationId = location.pathname.startsWith('/location/') 
    ? location.pathname.split('/location/')[1] 
    : null;

  // Use throttled scroll handler to improve performance
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    // Add passive listener for better scroll performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <NavHeader scrolled={scrolled}>
        <DesktopNav 
          location={location} 
          locationId={locationId}
        />
        <div className="flex md:hidden items-center">
          <ProfileButton />
        </div>
      </NavHeader>
      
      <MobileNav 
        location={location} 
        locationId={locationId}
      />
    </motion.div>
  );
};

export default NavBar;
