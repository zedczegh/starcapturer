
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Telescope, Map, Smartphone, Users } from "lucide-react";
import { MobileNavButton } from "./NavButtons";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface MobileNavProps {
  location: ReturnType<typeof useLocation>;
  locationId: string | null;
}

const MobileNav: React.FC<MobileNavProps> = ({
  location,
  locationId
}) => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Use a default location ID for when there isn't one
  const detailsPath = locationId ? `/location/${locationId}` : '/location/default';

  // Handle scroll behavior - hide navbar when scrolling down, show when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <motion.div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav-bar"
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-around items-center py-3 px-2 bg-[#123341]/[0.92] backdrop-blur-xl border-t border-cosmic-100/15 shadow-lg">
        <motion.div 
          className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-primary/10 via-primary/60 to-primary/10"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        
        <MobileNavButton 
          to="/photo-points" 
          icon={<Telescope className="h-5 w-5" />} 
          label={t("Photo", "拍摄")} 
          active={location.pathname === "/photo-points"} 
        />
        
        <MobileNavButton 
          to={detailsPath}
          icon={<Map className="h-5 w-5" />} 
          label={t("Location", "位置")} 
          active={location.pathname.startsWith('/location/')} 
        />

        <MobileNavButton
          to="/community"
          icon={<Users className="h-5 w-5" />}
          label={t("Community", "社区")}
          active={location.pathname === "/community"}
        />
        
        <MobileNavButton 
          to="/share" 
          icon={<Smartphone className="h-5 w-5" />} 
          label={t("Bortle", "光污染")} 
          active={location.pathname === "/share"} 
        />
      </div>
    </motion.div>
  );
};

export default MobileNav;
