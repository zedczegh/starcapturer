
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MoonStar } from "lucide-react";
import LanguageSwitcher from "../LanguageSwitcher";
import { cn } from "@/lib/utils";
import LocationPinButton from "./LocationPinButton";
import { motion } from "framer-motion";

interface NavHeaderProps {
  scrolled: boolean;
  children?: React.ReactNode;
}

const NavHeader: React.FC<NavHeaderProps> = ({
  scrolled,
  children
}) => {
  const [animate, setAnimate] = useState(false);
  
  // Add a small delay before animating to ensure smooth initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out", 
        scrolled ? "py-2 glassmorphism-strong shadow-lg" : "py-4 bg-transparent"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center space-x-2 z-20 transition-all duration-300 hover:opacity-80 hover:scale-[1.02]"
        >
          <motion.div
            initial={{ rotate: -30, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <MoonStar className="h-8 w-8 text-primary" />
          </motion.div>
          <motion.span 
            className="text-xl font-bold tracking-tight"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Astro<span className="text-primary">SIQS</span>
          </motion.span>
        </Link>
        
        {children}
        
        <div className="flex md:hidden items-center space-x-3">
          <LocationPinButton />
          <LanguageSwitcher />
        </div>
      </div>
      
      {scrolled && (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: animate ? 1 : 0 }}
          transition={{ duration: 0.8 }}
        />
      )}
    </motion.header>
  );
};

export default NavHeader;
