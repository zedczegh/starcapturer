
import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Book, Search, AlertCircle, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LinksHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onToggleFilters: () => void;
  filtersVisible: boolean;
}

const LinksHeader = ({ searchQuery, onSearchChange, onClearSearch, onToggleFilters, filtersVisible }: LinksHeaderProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-6">
        <div>
          <motion.div 
            className="flex items-center gap-3 mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="p-3 bg-gradient-to-br from-blue-500/30 to-purple-500/20 rounded-xl shadow-lg shadow-blue-900/10">
              <Book className="h-6 w-6 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-100 to-purple-200 bg-clip-text text-transparent">
              {t("Astronomy Resources", "天文资源")}
            </h1>
          </motion.div>
          <motion.p 
            className="text-cosmic-300 max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            {t(
              "A curated collection of the best resources, tools, and educational materials for astrophotography and astronomical observation.",
              "精心挑选的天文摄影和天文观测最佳资源、工具和教育材料集合。"
            )}
          </motion.p>
        </div>
        
        <motion.div 
          className={`relative w-full md:w-80 ${isSearchFocused ? 'ring-2 ring-blue-500/30' : ''}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cosmic-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("Search resources...", "搜索资源...")} 
            className="pl-10 bg-cosmic-900/70 border-cosmic-700/50 text-cosmic-100 placeholder:text-cosmic-500 transition-all focus:bg-cosmic-900/90 focus:border-cosmic-600"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery && (
            <button 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cosmic-400 hover:text-cosmic-200"
              onClick={onClearSearch}
            >
              ×
            </button>
          )}
        </motion.div>
      </div>

      <motion.div 
        className="p-5 bg-gradient-to-r from-blue-950/40 to-purple-950/30 border border-blue-900/40 rounded-lg shadow-lg shadow-cosmic-950/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="flex items-start gap-4">
          <div className="hidden md:flex mt-1">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium text-cosmic-100 mb-2">
              {t("Looking for specific resources?", "寻找特定资源？")}
            </h3>
            <p className="text-sm text-cosmic-200">
              {t(
                "Use our improved filters to find exactly what you need. Browse by categories like Hardware, Software, or Tutorials; or filter by specific resource types.",
                "使用我们改进的过滤器来找到您确切需要的内容。按硬件、软件或教程等类别浏览；或按特定资源类型过滤。"
              )}
            </p>
            <div className="mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-cosmic-800/50 text-sm border-cosmic-700/40 hover:bg-cosmic-700/60 flex items-center gap-2"
                onClick={onToggleFilters}
              >
                <Filter className="h-3.5 w-3.5" /> 
                {t("Show Filters", "显示过滤器")}
                {filtersVisible ? 
                  <ChevronUp className="h-3.5 w-3.5 ml-1" /> : 
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                }
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LinksHeader;
