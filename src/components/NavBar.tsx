import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import NavHeader from "./navbar/NavHeader";
import DesktopNav from "./navbar/DesktopNav";
import MobileNav from "./navbar/MobileNav";

interface NavBarProps {
  transparent?: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ transparent = false }) => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  const locationId = location.pathname.startsWith('/location/') 
    ? location.pathname.split('/location/')[1] 
    : null;

  const { t, language, setLanguage } = useLanguage();
  
  const routes = [
    {
      name: t("Home", "首页"),
      href: "/",
    },
    {
      name: t("Map", "地图"),
      href: "/map",
    },
    {
      name: t("Photo Points", "拍摄点"),
      href: "/photo-points",
    },
    {
      name: t("My Locations", "我的位置"),
      href: "/locations",
    },
    {
      name: t("Settings", "设置"),
      href: "/settings",
    },
  ];
  
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
