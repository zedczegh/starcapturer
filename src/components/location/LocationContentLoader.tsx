
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  loadingText?: string;
}

const LocationContentLoader: React.FC<Props> = React.memo(({ loadingText }) => {
  const { t } = useLanguage();
  
  return (
    <div className="animate-pulse h-96 rounded-lg bg-gradient-to-b from-cosmic-800/20 to-cosmic-900/20 flex items-center justify-center">
      <div className="text-center space-y-3 pb-4">
        <div className="flex flex-col items-center">
          <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-muted-foreground">
            {loadingText || t("Loading content...", "正在加载内容...")}
          </p>
        </div>
        <div className="max-w-[200px] mx-auto">
          <div className="h-2.5 bg-muted-foreground/20 rounded-full mb-2"></div>
          <div className="h-2.5 bg-muted-foreground/20 rounded-full mb-2 w-3/4"></div>
          <div className="h-2.5 bg-muted-foreground/20 rounded-full w-1/2"></div>
        </div>
      </div>
    </div>
  );
});

LocationContentLoader.displayName = 'LocationContentLoader';

export default LocationContentLoader;
