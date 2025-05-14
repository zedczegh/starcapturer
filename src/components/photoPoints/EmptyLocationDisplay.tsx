
import React from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { RefreshCcw } from "lucide-react";

// Update the props interface to include title and description props
interface EmptyLocationDisplayProps {
  userLocation?: { latitude: number; longitude: number };
  onRefresh: () => void;
  activeView?: "certified" | "calculated";
  title?: string; // Add title prop
  description?: string; // Add description prop
}

const EmptyLocationDisplay: React.FC<EmptyLocationDisplayProps> = ({
  userLocation,
  onRefresh,
  activeView = "certified",
  title, // Use custom title if provided
  description // Use custom description if provided
}) => {
  const { t } = useLanguage();

  const getTitle = () => {
    if (title) return title;
    
    if (activeView === "certified") {
      return t(
        "No Certified Dark Sky Locations Found",
        "未找到认证的暗夜保护区"
      );
    }
    return t(
      "No Calculated Locations Found",
      "未找到计算出的观星点"
    );
  };

  const getDescription = () => {
    if (description) return description;
    
    if (activeView === "certified") {
      return t(
        "There are no certified dark sky locations in your current view.",
        "当前视图中没有认证的暗夜保护区。"
      );
    }
    return t(
      "No calculated observation points found in your area.",
      "在您的区域内找不到计算出的观测点。"
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h3 className="text-lg font-medium mb-2">{getTitle()}</h3>
      <p className="text-muted-foreground mb-4">
        {getDescription()}
      </p>
      <Button 
        variant="outline" 
        className="flex items-center gap-2" 
        onClick={onRefresh}
      >
        <RefreshCcw className="w-4 h-4" />
        {t("Refresh", "刷新")}
      </Button>
    </div>
  );
};

export default EmptyLocationDisplay;
