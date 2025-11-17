import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateProfileTag } from "@/utils/linkTranslations";

// Apple-style vibrant colors with gradients
const BUBBLE_COLORS = [
  { from: "from-blue-500", to: "to-cyan-400", glow: "shadow-blue-500/50" },
  { from: "from-purple-500", to: "to-pink-400", glow: "shadow-purple-500/50" },
  { from: "from-green-500", to: "to-emerald-400", glow: "shadow-green-500/50" },
  { from: "from-orange-500", to: "to-yellow-400", glow: "shadow-orange-500/50" },
  { from: "from-red-500", to: "to-pink-400", glow: "shadow-red-500/50" },
  { from: "from-indigo-500", to: "to-purple-400", glow: "shadow-indigo-500/50" },
  { from: "from-teal-500", to: "to-cyan-400", glow: "shadow-teal-500/50" },
  { from: "from-pink-500", to: "to-rose-400", glow: "shadow-pink-500/50" },
];

interface AppleStyleTagBubbleProps {
  tag: string;
  index: number;
}

// Extract initials from tag name
const getInitials = (text: string): string => {
  const words = text.split(' ');
  if (words.length === 1) {
    return text.substring(0, 2).toUpperCase();
  }
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

const AppleStyleTagBubble: React.FC<AppleStyleTagBubbleProps> = ({ tag, index }) => {
  const { language } = useLanguage();
  const displayText = language === 'zh' ? translateProfileTag(tag) : tag;
  const initials = getInitials(tag);
  
  // Cycle through colors based on index
  const colorScheme = BUBBLE_COLORS[index % BUBBLE_COLORS.length];
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: index * 0.05 
      }}
      whileHover={{ scale: 1.1 }}
      className="relative group"
    >
      {/* Bubble */}
      <div className={`
        relative w-12 h-12 rounded-full 
        bg-gradient-to-br ${colorScheme.from} ${colorScheme.to}
        flex items-center justify-center
        shadow-lg ${colorScheme.glow}
        cursor-pointer
        transition-all duration-300
        hover:shadow-xl
      `}>
        <span className="text-white font-bold text-sm">
          {initials}
        </span>
      </div>
      
      {/* Tooltip on hover */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        whileHover={{ opacity: 1, y: 0, scale: 1 }}
        className="
          absolute -top-12 left-1/2 -translate-x-1/2
          px-3 py-1.5 rounded-lg
          bg-cosmic-800/95 backdrop-blur-md
          border border-white/20
          shadow-xl
          pointer-events-none
          opacity-0 group-hover:opacity-100
          transition-all duration-200
          whitespace-nowrap
          z-10
        "
      >
        <span className="text-xs font-medium text-white">
          {displayText}
        </span>
        {/* Arrow */}
        <div className="
          absolute -bottom-1 left-1/2 -translate-x-1/2
          w-2 h-2 rotate-45
          bg-cosmic-800/95 border-r border-b border-white/20
        "></div>
      </motion.div>
    </motion.div>
  );
};

export default AppleStyleTagBubble;
