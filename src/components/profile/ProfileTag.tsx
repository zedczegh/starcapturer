
import React from "react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateProfileTag } from "@/utils/linkTranslations";
import { motion } from "framer-motion";

// Define colors for different tags using a dynamic color scheme with gradient backgrounds
const TAG_COLORS: Record<string, { bg: string }> = {
  // Astronomy tags - blues, purples, indigos
  "Professional Astronomer": { bg: "bg-gradient-to-r from-indigo-500/20 to-blue-500/20 border-indigo-500/30" },
  "Amateur Astronomer": { bg: "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30" },
  "Star Gazer": { bg: "bg-gradient-to-r from-rose-500/20 to-pink-500/20 border-rose-500/30" },
  "Astrophotographer": { bg: "bg-gradient-to-r from-purple-500/20 to-violet-500/20 border-purple-500/30" },
  "Cosmos Lover": { bg: "bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 border-pink-500/30" },
  "Planet Watcher": { bg: "bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500/30" },
  "Nebulae Observer": { bg: "bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500/30" },
  "Telescope Maker": { bg: "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30" },
  "Astronomy Student": { bg: "bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border-teal-500/30" },
  "Dark Sky Volunteer": { bg: "bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-500/30" },
  
  // Outdoor & Nature tags - greens, earth tones
  "Mountaineer": { bg: "bg-gradient-to-r from-slate-500/20 to-gray-500/20 border-slate-500/30" },
  "Hiker": { bg: "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30" },
  "Rock Climber": { bg: "bg-gradient-to-r from-stone-500/20 to-slate-500/20 border-stone-500/30" },
  "Camper": { bg: "bg-gradient-to-r from-lime-500/20 to-green-500/20 border-lime-500/30" },
  "Nature Photographer": { bg: "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30" },
  "Wildlife Observer": { bg: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30" },
  "Trail Runner": { bg: "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30" },
  "Backpacker": { bg: "bg-gradient-to-r from-brown-500/20 to-amber-500/20 border-brown-500/30" },
  "Adventure Seeker": { bg: "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30" },
  "Outdoor Enthusiast": { bg: "bg-gradient-to-r from-green-500/20 to-lime-500/20 border-green-500/30" },
  "Desert Explorer": { bg: "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30" },
  "Alpine Climber": { bg: "bg-gradient-to-r from-sky-500/20 to-blue-500/20 border-sky-500/30" },
  
  // Weather & Exploration - cyans, special effects
  "Meteorology Enthusiast": { bg: "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30" },
  "Storm Chaser": { bg: "bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-500/30" },
  "Aurora Hunter": { bg: "bg-gradient-to-r from-green-400/20 via-purple-400/20 to-pink-400/20 border-green-400/30" },
  "Traveler": { bg: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30" },
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
      className={`${bg} text-white/90 font-medium ${sizeClasses[size]} cursor-default backdrop-blur-sm shadow-lg hover:scale-105 transition-transform duration-200`}
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
