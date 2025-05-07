
import React from "react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateProfileTag } from "@/utils/linkTranslations";
import { motion } from "framer-motion";

// Define colors for different tags using a consistent color scheme with white text
// inspired by the SIQS score badges design
const TAG_COLORS: Record<string, { bg: string }> = {
  "Professional Astronomer": { bg: "bg-indigo-500/30 dark:bg-indigo-900/40" },
  "Amateur Astronomer": { bg: "bg-blue-500/30 dark:bg-blue-900/40" },
  "Astrophotographer": { bg: "bg-purple-500/30 dark:bg-purple-900/40" },
  "Meteorology Enthusiast": { bg: "bg-cyan-500/30 dark:bg-cyan-900/40" },
  "Cosmos Lover": { bg: "bg-pink-500/30 dark:bg-pink-900/40" },
  "Traveler": { bg: "bg-amber-500/30 dark:bg-amber-900/40" },
  "Dark Sky Volunteer": { bg: "bg-emerald-500/30 dark:bg-emerald-900/40" },
  "Nebulae Observer": { bg: "bg-violet-500/30 dark:bg-violet-900/40" },
  "Astronomy Student": { bg: "bg-teal-500/30 dark:bg-teal-900/40" },
  "Planet Watcher": { bg: "bg-orange-500/30 dark:bg-orange-900/40" },
  "Telescope Maker": { bg: "bg-yellow-500/30 dark:bg-yellow-900/40" },
  "Star Gazer": { bg: "bg-rose-500/30 dark:bg-rose-900/40" },
};

// Get default colors for tags not in our map - using cosmic theme colors for consistency
const DEFAULT_TAG_COLORS = { bg: "bg-cosmic-700/40 dark:bg-cosmic-800/60" };

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
      className={`${bg} text-white border border-white/20 font-medium ${sizeClasses[size]} cursor-default hover:${bg} backdrop-blur-sm shadow-sm`}
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
