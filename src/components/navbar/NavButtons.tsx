
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
        "relative flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-300 mobile-nav-item z-10",
        active ? "text-primary" : "text-foreground/60 hover:text-foreground/80"
      )}
    >
      <div className={cn(
        "icon-container p-2.5 mb-1.5 rounded-full transition-all duration-300 relative",
        active 
          ? "bg-gradient-to-br from-primary/20 to-accent/20 shadow-[0_0_12px_rgba(139,92,246,0.3)] border border-primary/30" 
          : "bg-background/30 hover:bg-background/40 border border-border/30"
      )}>
        {active && (
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
        )}
        <div className="relative z-10">
          {icon}
        </div>
      </div>
      <span className={cn(
        "text-[10px] font-medium mt-0.5 transition-colors",
        language === 'zh' ? 'tracking-tight' : 'tracking-wide',
        active && "font-semibold"
      )}>
        {label}
      </span>
      {active && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 rounded-full" />
      )}
    </Link>
  );
};
