
import React from "react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateProfileTag } from "@/utils/linkTranslations";
import { motion } from "framer-motion";

// Define colors for different tags using more muted, softer colors
const TAG_COLORS: Record<string, { bg: string, text: string }> = {
  "Professional Astronomer": { bg: "bg-indigo-100/60 dark:bg-indigo-950/60", text: "text-indigo-800 dark:text-indigo-200" },
  "Amateur Astronomer": { bg: "bg-blue-100/60 dark:bg-blue-950/60", text: "text-blue-800 dark:text-blue-200" },
  "Astrophotographer": { bg: "bg-purple-100/60 dark:bg-purple-950/60", text: "text-purple-800 dark:text-purple-200" },
  "Meteorology Enthusiast": { bg: "bg-cyan-100/60 dark:bg-cyan-950/60", text: "text-cyan-800 dark:text-cyan-200" },
  "Cosmos Lover": { bg: "bg-pink-100/60 dark:bg-pink-950/60", text: "text-pink-800 dark:text-pink-200" },
  "Traveler": { bg: "bg-amber-100/60 dark:bg-amber-950/60", text: "text-amber-800 dark:text-amber-200" },
  "Dark Sky Volunteer": { bg: "bg-emerald-100/60 dark:bg-emerald-950/60", text: "text-emerald-800 dark:text-emerald-200" },
  "Nebulae Observer": { bg: "bg-violet-100/60 dark:bg-violet-950/60", text: "text-violet-800 dark:text-violet-200" },
  "Astronomy Student": { bg: "bg-teal-100/60 dark:bg-teal-950/60", text: "text-teal-800 dark:text-teal-200" },
  "Planet Watcher": { bg: "bg-orange-100/60 dark:bg-orange-950/60", text: "text-orange-800 dark:text-orange-200" },
  "Telescope Maker": { bg: "bg-yellow-100/60 dark:bg-yellow-950/60", text: "text-yellow-800 dark:text-yellow-200" },
  "Star Gazer": { bg: "bg-rose-100/60 dark:bg-rose-950/60", text: "text-rose-800 dark:text-rose-200" },
};

// Get default colors for tags not in our map - also more muted
const DEFAULT_TAG_COLORS = { bg: "bg-cosmic-100/20 dark:bg-cosmic-800/50", text: "text-cosmic-800 dark:text-cosmic-200" };

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
      className={`${bg} ${text} border border-current/10 font-medium ${sizeClasses[size]} cursor-default hover:${bg}`}
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
