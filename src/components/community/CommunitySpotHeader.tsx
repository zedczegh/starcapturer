
import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Circle } from "lucide-react";

interface CommunitySpotHeaderProps {
  titleVariants: any;
  lineVariants: any;
  descVariants: any;
}

const CommunitySpotHeader: React.FC<CommunitySpotHeaderProps> = ({
  titleVariants,
  lineVariants,
  descVariants
}) => {
  const { t } = useLanguage();
  
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-3 mb-9"
      initial="hidden"
      animate="visible"
      variants={{}}
    >
      <motion.h1
        className="font-extrabold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent text-3xl md:text-4xl text-center drop-shadow tracking-tight"
        variants={titleVariants}
      >
        {t("Meteo Spots Community", "气象点社区")}
      </motion.h1>
      <motion.div
        className="rounded-full h-1 bg-gradient-to-r from-primary to-accent mb-1"
        style={{ width: 90, maxWidth: "40vw" }}
        variants={lineVariants}
      />
      <motion.p
        className="text-center mb-2 mt-1 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed"
        variants={descVariants}
      >
          {t(
            "Discover and explore different types of meteo spots. Each tab offers unique locations from certified dark sky areas to mountains and obscura sites.",
            "探索不同类型的气象点。每个标签提供从认证暗夜区域到山脉和奇观地点的独特位置。"
          )}
      </motion.p>
    </motion.div>
  );
};

export default CommunitySpotHeader;
