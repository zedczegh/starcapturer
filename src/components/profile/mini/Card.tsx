
import React from "react";
import BorderlessFrame from "@/components/ui/borderless-frame";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
}

const Card: React.FC<CardProps> = ({ children, className = "", variant = "default" }) => {
  return (
    <BorderlessFrame 
      variant={variant}
      className={`hover:bg-cosmic-800/40 transition-colors duration-300 ${className}`}
    >
      {children}
    </BorderlessFrame>
  );
};

export default Card;
