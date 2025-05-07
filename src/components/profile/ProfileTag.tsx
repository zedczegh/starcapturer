
import React from "react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateProfileTag } from "@/utils/linkTranslations";

interface ProfileTagProps {
  tag: string;
  size?: "sm" | "md" | "lg";
}

const ProfileTag: React.FC<ProfileTagProps> = ({ tag, size = "md" }) => {
  const { language } = useLanguage();
  const displayTag = language === 'zh' ? translateProfileTag(tag) : tag;
  
  // Determine the tag color based on the tag content
  const getTagColor = (tag: string): string => {
    // Different colorful gradients for different tags
    switch (tag) {
      case "Professional Astronomer":
        return "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700";
      case "Amateur Astronomer":
        return "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600";
      case "Astrophotographer":
        return "bg-gradient-to-r from-rose-400 to-red-500 hover:from-rose-500 hover:to-red-600";
      case "Meteorology Enthusiast":
        return "bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600";
      case "Cosmos Lover":
        return "bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700";
      case "Traveler":
        return "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600";
      case "Dark Sky Volunteer":
        return "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600";
      default:
        return "bg-gradient-to-r from-primary to-purple-500 hover:from-primary hover:to-purple-600";
    }
  };

  // Determine size classes
  const getSizeClasses = () => {
    switch(size) {
      case "sm":
        return "px-2 py-0.5 text-xs";
      case "lg":
        return "px-3 py-1 text-sm";
      default:
        return "px-2.5 py-0.5 text-xs";
    }
  };

  return (
    <Badge 
      className={`
        ${getTagColor(tag)}
        ${getSizeClasses()}
        text-white font-medium rounded-full shadow-sm
        transition-all duration-200 border-none
        hover:shadow-md animate-fade-in
      `}
    >
      {displayTag}
    </Badge>
  );
};

export default ProfileTag;
