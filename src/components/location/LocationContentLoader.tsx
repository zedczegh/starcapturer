
import React from "react";
import { Loader } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  loadingText?: string;
}

const LocationContentLoader: React.FC<Props> = ({ loadingText }) => {
  const { t } = useLanguage();
  return (
    <div className="animate-pulse h-96 rounded-lg bg-gradient-to-b from-cosmic-800/20 to-cosmic-900/20 flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-muted-foreground">{loadingText || t("Loading content...", "正在加载内容...")}</p>
      </div>
    </div>
  );
};

export default LocationContentLoader;
