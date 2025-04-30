
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const CommunityLocationsEmpty: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <motion.div 
      className="w-full text-muted-foreground/70 text-center py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {t("No community astrospots yet. Be the first to share!", "还没有社区观星点，快来分享吧！")}
    </motion.div>
  );
};

export default CommunityLocationsEmpty;
