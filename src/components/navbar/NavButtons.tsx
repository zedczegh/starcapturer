
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface NavLinkProps { 
  to: string; 
  active: boolean; 
  children: React.ReactNode 
}

export const NavLink: React.FC<NavLinkProps> = ({ to, active, children }) => {
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

interface MobileNavButtonProps { 
  to: string; 
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const MobileNavButton: React.FC<MobileNavButtonProps> = ({ 
  to, 
  icon, 
  label, 
  active,
  onClick
}) => {
  const { language } = useLanguage();
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center px-3 py-1 rounded-lg transition-all duration-300 mobile-nav-item",
        active ? "active text-primary" : "text-cosmic-300 hover:text-cosmic-100"
      )}
    >
      <motion.div 
        className={cn(
          "icon-container p-2 rounded-full transition-all duration-300",
          active ? "bg-primary/15" : "bg-transparent"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {icon}
      </motion.div>
      <motion.span 
        className={`text-xs mt-1.5 ${language === 'zh' ? 'font-medium' : ''} ${active ? 'font-medium' : ''}`}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: active ? 1 : 0.7 }}
      >
        {label}
      </motion.span>
      {active && (
        <motion.div 
          className="absolute bottom-0 w-1.5 h-1.5 bg-primary rounded-full"
          layoutId="activeIndicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  );
};
