
import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiqsNavigation } from "@/hooks/navigation/useSiqsNavigation";

const SiqsNavButton: React.FC = () => {
  const { t } = useLanguage();
  const { handleSIQSClick } = useSiqsNavigation();

  return (
    <Button
      onClick={handleSIQSClick}
      variant="outline"
      className="bg-slate-800/50 hover:bg-slate-700/80 border-cyan-600/40 text-primary"
    >
      {t("SIQS NOW", "SIQS 现在")}
    </Button>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(SiqsNavButton);
