
import React from "react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateProfileTag } from "@/utils/linkTranslations";
import { motion } from "framer-motion";

// Define colors for different tags
const TAG_COLORS: Record<string, { bg: string, text: string }> = {
  "Professional Astronomer": { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
  "Amateur Astronomer": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  "Astrophotographer": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  "Meteorology Enthusiast": { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
  "Cosmos Lover": { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300" },
  "Traveler": { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  "Dark Sky Volunteer": { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
};

// Get default colors for tags not in our map
const DEFAULT_TAG_COLORS = { bg: "bg-cosmic-100/10", text: "text-cosmic-300" };

interface ProfileTagProps {
  tag: string;
  animated?: boolean;
  size?: "sm" | "md" | "lg";
}

const ProfileTag: React.FC<ProfileTagProps> = ({ tag, animated = false, size = "md" }) => {
  const { language } = useLanguage();
  const displayText = language === 'zh' ? translateProfileTag(tag) : tag;
  const { bg, text } = TAG_COLORS[tag] || DEFAULT_TAG_COLORS;
  
  // Adjust size classes
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.75 text-sm",
    lg: "px-3 py-1 text-base"
  };
  
  const TagComponent = (
    <Badge
      className={`${bg} ${text} border-none font-medium ${sizeClasses[size]} cursor-default hover:${bg}`}
      variant="outline"
    >
      {displayText}
    </Badge>
  );
  
  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {TagComponent}
      </motion.div>
    );
  }
  
  return TagComponent;
};

export default ProfileTag;
