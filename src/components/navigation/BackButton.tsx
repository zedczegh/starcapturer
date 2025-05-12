
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
    
    // Check if we should avoid clearing cache (for popup navigation)
    const noRefresh = location.state?.noRefresh === true;
    
    // Only clear cache if not coming from a marker popup
    if (!noRefresh) {
      clearSpotCache();
    }
    
    // Use state-based routing if there's "from" information available
    const fromPage = location.state?.from;
    
    if (fromPage === 'community') {
      // When returning to the community page, add proper state
      navigate('/community', { 
        replace,
        state: { 
          refreshTimestamp: noRefresh ? undefined : Date.now(),
          returnedFromSpot: !noRefresh,
          forceRefresh: !noRefresh,
          noRefresh: noRefresh
        }
      });
    } else if (fromPage === 'photoPoints') {
      navigate('/photo-points', {
        replace,
        state: { 
          refreshTimestamp: noRefresh ? undefined : Date.now(),
          returnedFromSpot: !noRefresh,
          forceRefresh: !noRefresh,
          noRefresh: noRefresh
        }
      });
    } else {
      // Default behavior
      navigate(destination, { 
        replace,
        state: {
          refreshTimestamp: noRefresh ? undefined : Date.now(),
          forceRefresh: !noRefresh,
          noRefresh: noRefresh
        }
      });
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
