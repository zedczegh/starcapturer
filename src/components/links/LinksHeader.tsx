
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Link2, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";

const LinksHeader = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Link2 className="h-6 w-6 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-cosmic-50">
              {t("Useful Links", "实用链接")}
            </h1>
          </div>
          <p className="text-cosmic-300 max-w-2xl">
            {t(
              "A comprehensive collection of resources, tools, and educational materials for astrophotography and astronomical observation.",
              "天文摄影和天文观测的综合资源、工具和教育材料集合。"
            )}
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cosmic-400" />
          <Input 
            placeholder={t("Search resources...", "搜索资源...")} 
            className="pl-10 bg-cosmic-900/70 border-cosmic-700/50 text-cosmic-100 placeholder:text-cosmic-500"
          />
        </div>
      </div>

      <div className="p-4 bg-blue-950/30 border border-blue-900/30 rounded-lg text-sm text-cosmic-200">
        <p>
          {t(
            "We've curated these resources from the astrophotography community. If you'd like to contribute or suggest additional links, please contact us.",
            "我们从天文摄影社区精心挑选了这些资源。如果您想贡献或推荐其他链接，请与我们联系。"
          )}
        </p>
      </div>
    </motion.div>
  );
};

export default LinksHeader;
