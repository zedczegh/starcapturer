
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  loadingText?: string;
}

const LocationContentLoader: React.FC<Props> = React.memo(({ loadingText }) => {
  const { t } = useLanguage();
  
  return (
    <div className="animate-pulse h-96 rounded-lg bg-gradient-to-b from-cosmic-800/20 to-cosmic-900/20 flex items-center justify-center">
      <div className="text-center space-y-4 pb-6">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">
            {loadingText || t("Loading content...", "正在加载内容...")}
          </p>
        </div>
        <div className="max-w-[200px] mx-auto">
          <div className="h-3 bg-muted-foreground/20 rounded-full mb-2.5"></div>
          <div className="h-3 bg-muted-foreground/20 rounded-full mb-2.5 w-3/4"></div>
          <div className="h-3 bg-muted-foreground/20 rounded-full w-1/2"></div>
        </div>
      </div>
    </div>
  );
});

LocationContentLoader.displayName = 'LocationContentLoader';

export default LocationContentLoader;
