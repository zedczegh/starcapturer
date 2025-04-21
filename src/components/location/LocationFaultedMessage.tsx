
import React from "react";
import { Loader } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  show?: boolean;
}

const LocationFaultedMessage: React.FC<Props> = ({ show = false }) => {
  const { t } = useLanguage();
  if (!show) return null;
  return (
    <div className="p-8 flex flex-col items-center justify-center max-w-xl mx-auto">
      <div className="rounded-lg bg-yellow-300/10 border border-yellow-300/30 py-4 px-6 my-3 text-center animate-shake">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium mb-1">
          {t("There was a problem loading conditions at this location.", "加载此位置条件时出现问题。")}
        </p>
        <p className="text-yellow-700 dark:text-yellow-300 text-xs">
          {t("You can try to refresh manually using the button above.", "您可以使用上方的按钮手动刷新。")}
        </p>
      </div>
      <div className="flex justify-center mt-5">
        <Loader className="h-6 w-6 text-yellow-400/80 animate-spin-slow" />
      </div>
    </div>
  );
};

export default LocationFaultedMessage;
