
import React from "react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateProfileTag } from "@/utils/linkTranslations";
import { motion } from "framer-motion";

// Define colors for different tags using a consistent color scheme with white text
// inspired by the SIQS score badges design but with increased translucency and lower brightness
const TAG_COLORS: Record<string, { bg: string }> = {
  "Professional Astronomer": { bg: "bg-indigo-500/15 dark:bg-indigo-900/20" },
  "Amateur Astronomer": { bg: "bg-blue-500/15 dark:bg-blue-900/20" },
  "Astrophotographer": { bg: "bg-purple-500/15 dark:bg-purple-900/20" },
  "Meteorology Enthusiast": { bg: "bg-cyan-500/15 dark:bg-cyan-900/20" },
  "Cosmos Lover": { bg: "bg-pink-500/15 dark:bg-pink-900/20" },
  "Traveler": { bg: "bg-amber-500/15 dark:bg-amber-900/20" },
  "Dark Sky Volunteer": { bg: "bg-emerald-500/15 dark:bg-emerald-900/20" },
  "Nebulae Observer": { bg: "bg-violet-500/15 dark:bg-violet-900/20" },
  "Astronomy Student": { bg: "bg-teal-500/15 dark:bg-teal-900/20" },
  "Planet Watcher": { bg: "bg-orange-500/15 dark:bg-orange-900/20" },
  "Telescope Maker": { bg: "bg-yellow-500/15 dark:bg-yellow-900/20" },
  "Star Gazer": { bg: "bg-rose-500/15 dark:bg-rose-900/20" },
};

// Get default colors for tags not in our map - using cosmic theme colors for consistency
const DEFAULT_TAG_COLORS = { bg: "bg-cosmic-700/20 dark:bg-cosmic-800/30" };

interface ProfileTagProps {
  tag: string;
  animated?: boolean;
  size?: "sm" | "md" | "lg";
}

const ProfileTag: React.FC<ProfileTagProps> = ({ tag, animated = false, size = "md" }) => {
  const { language } = useLanguage();
  const displayText = language === 'zh' ? translateProfileTag(tag) : tag;
  const { bg } = TAG_COLORS[tag] || DEFAULT_TAG_COLORS;
  
  // Adjust size classes
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.75 text-sm",
    lg: "px-3 py-1 text-base"
  };
  
  const TagComponent = (
    <Badge
      className={`${bg} text-white/85 border border-white/10 font-medium ${sizeClasses[size]} cursor-default hover:${bg} backdrop-blur-sm shadow-sm`}
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
