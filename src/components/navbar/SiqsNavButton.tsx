
import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiqsNavigation } from "@/hooks/navigation/useSiqsNavigation";

interface SiqsNavButtonProps {
  locationId: string | null;
  beijingData: any;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
}

const SiqsNavButton: React.FC<SiqsNavButtonProps> = ({
  locationId,
  beijingData,
  isLoading,
  setIsLoading
}) => {
  const { t } = useLanguage();
  const { handleSIQSClick } = useSiqsNavigation(locationId, beijingData, isLoading, setIsLoading);

  return (
    <Button
      onClick={handleSIQSClick}
      variant="outline"
      className="bg-slate-800/50 hover:bg-slate-700/80 border-cyan-600/40 text-primary"
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="animate-pulse">{t("Loading...", "加载中...")}</span>
      ) : (
        t("SIQS NOW", "SIQS 现在")
      )}
    </Button>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(SiqsNavButton);
