
import React from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  loadingText?: string;
}

const LocationContentLoader: React.FC<Props> = React.memo(({ loadingText }) => {
  const { t } = useLanguage();
  
  return (
    <div className="h-96 rounded-lg bg-gradient-to-b from-cosmic-800/10 to-cosmic-900/10 flex items-center justify-center">
      <div className="text-center space-y-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        <p className="text-sm text-cosmic-300">
          {loadingText || t("Loading", "加载中")}
        </p>
      </div>
    </div>
  );
});

LocationContentLoader.displayName = 'LocationContentLoader';

export default LocationContentLoader;
