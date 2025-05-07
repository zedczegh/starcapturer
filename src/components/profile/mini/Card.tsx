
import React from "react";
import { Card as ShadcnCard } from "@/components/ui/card";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <ShadcnCard className={`bg-cosmic-900/70 backdrop-blur-md border border-cosmic-700/50 hover:border-cosmic-600/70 transition-colors duration-300 shadow-md hover:shadow-lg ${className}`}>
      {children}
    </ShadcnCard>
  );
};

export default Card;
