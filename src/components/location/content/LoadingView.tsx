
import React from "react";
import { Loader } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LoadingViewProps {
  message?: string;
}

const LoadingView: React.FC<LoadingViewProps> = ({ 
  message 
}) => {
  const { t } = useLanguage();
  const defaultMessage = t("Loading location data...", "正在加载位置数据...");
  
  return (
    <div className="p-4 text-center">
      <Loader className="mx-auto mb-2 h-6 w-6 animate-spin" />
      <p className="text-sm">{message || defaultMessage}</p>
    </div>
  );
};

export default LoadingView;
