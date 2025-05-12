
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  destination?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  replace?: boolean;
  onClick?: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({
  destination = "/",
  className,
  variant = "outline",
  size = "default",
  replace = false,
  onClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    // Use state-based routing if there's "from" information available
    const fromPage = location.state?.from;
    
    if (fromPage === 'community') {
      // Add timestamp when navigating back to ensure the community page refreshes properly
      navigate('/community', { 
        replace,
        state: { refreshTimestamp: new Date().getTime() }
      });
    } else {
      // Default behavior
      navigate(destination, { replace });
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn("flex items-center gap-1 font-medium", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {t("Back", "返回")}
    </Button>
  );
};

export default BackButton;
