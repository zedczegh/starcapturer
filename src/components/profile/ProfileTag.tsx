
import React from "react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateProfileTag } from "@/utils/linkTranslations";
import { motion } from "framer-motion";

// Define colors for different tags using a more refined, elegant color scheme
// inspired by the SIQS score badges design
const TAG_COLORS: Record<string, { bg: string, text: string }> = {
  "Professional Astronomer": { bg: "bg-indigo-500/20 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-300" },
  "Amateur Astronomer": { bg: "bg-blue-500/20 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-300" },
  "Astrophotographer": { bg: "bg-purple-500/20 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-300" },
  "Meteorology Enthusiast": { bg: "bg-cyan-500/20 dark:bg-cyan-900/30", text: "text-cyan-600 dark:text-cyan-300" },
  "Cosmos Lover": { bg: "bg-pink-500/20 dark:bg-pink-900/30", text: "text-pink-600 dark:text-pink-300" },
  "Traveler": { bg: "bg-amber-500/20 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-300" },
  "Dark Sky Volunteer": { bg: "bg-emerald-500/20 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-300" },
  "Nebulae Observer": { bg: "bg-violet-500/20 dark:bg-violet-900/30", text: "text-violet-600 dark:text-violet-300" },
  "Astronomy Student": { bg: "bg-teal-500/20 dark:bg-teal-900/30", text: "text-teal-600 dark:text-teal-300" },
  "Planet Watcher": { bg: "bg-orange-500/20 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-300" },
  "Telescope Maker": { bg: "bg-yellow-500/20 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-300" },
  "Star Gazer": { bg: "bg-rose-500/20 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-300" },
};

// Get default colors for tags not in our map - using cosmic theme colors for consistency
const DEFAULT_TAG_COLORS = { bg: "bg-cosmic-700/30 dark:bg-cosmic-800/50", text: "text-cosmic-400 dark:text-cosmic-300" };

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
      className={`${bg} ${text} border border-current/10 font-medium ${sizeClasses[size]} cursor-default hover:${bg} backdrop-blur-sm shadow-sm`}
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
