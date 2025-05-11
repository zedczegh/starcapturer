
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
        className="font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent text-3xl md:text-4xl text-center drop-shadow tracking-tight"
        variants={titleVariants}
      >
        {t("Astrospots Community", "观星社区")}
      </motion.h1>
      <motion.div
        className="rounded-full h-1 bg-gradient-to-r from-blue-400 to-purple-400 mb-1"
        style={{ width: 90, maxWidth: "40vw" }}
        variants={lineVariants}
      />
      <motion.p
        className="text-center mb-2 mt-1 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed"
        variants={descVariants}
      >
        {t(
          "Discover and explore astrospots contributed by our SIQS community members. View their favorite stargazing locations on the interactive map and find inspiration for your next adventure.",
          "由SIQS社区成员贡献的观星点，在这里一览无余。浏览大家推荐的拍摄位置，探索灵感，发现下次观星之旅的新去处。"
        )}
      </motion.p>
    </motion.div>
  );
};

export default CommunitySpotHeader;
