
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { clearSpotCache } from "@/utils/cache/spotCacheCleaner";

interface BackButtonProps {
  destination?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  replace?: boolean;
  onClick?: () => void;
  state?: Record<string, any>; // Add state prop to fix TypeScript error
}

const BackButton: React.FC<BackButtonProps> = ({
  destination = "/",
  className,
  variant = "outline",
  size = "default",
  replace = false,
  onClick,
  state
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    // Always clear any spot cache to ensure fresh data when navigating back
    clearSpotCache();
    
    // Use custom state if provided or create a standard one
    const navState = state || {
      refreshTimestamp: Date.now(),
      returnedFromSpot: true,
      forceRefresh: true
    };
    
    // Use state-based routing if there's "from" information available
    const fromPage = location.state?.from;
    
    if (fromPage === 'community') {
      // Always use a fresh timestamp to force community page update
      const refreshTimestamp = Date.now();
      console.log(`Navigating back to community with refresh timestamp: ${refreshTimestamp}`);
      
      // When returning to the community page, add a refresh timestamp to ensure 
      // the community page loads fresh data and doesn't use stale state
      navigate('/community', { 
        replace,
        state: { 
          ...navState,
          refreshTimestamp,
          returnedFromSpot: true,
          forceRefresh: true  // Add explicit flag for forcing refresh
        }
      });
    } else if (fromPage === 'photoPoints') {
      navigate('/photo-points', {
        replace,
        state: { 
          ...navState,
          refreshTimestamp: Date.now(),
          returnedFromSpot: true,
          forceRefresh: true
        }
      });
    } else {
      // Default behavior
      navigate(destination, { 
        replace,
        state: navState
      });
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn("flex items-center gap-1 font-medium transition-all duration-200", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {t("Back", "返回")}
    </Button>
  );
};

export default BackButton;
