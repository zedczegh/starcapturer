
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

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
      <span className={`text-xs mt-1 ${language === 'zh' ? 'font-medium' : ''}`}>{label}</span>
    </Link>
  );
};
