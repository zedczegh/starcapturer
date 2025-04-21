
import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Layers, LineChart, CirclePlus, CircleMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLinksFilters } from "@/hooks/useLinksFilters";
import { translateType } from "@/utils/linkTranslations";

interface LinksFiltersProps {
  searchQuery: string;
  onClearSearch: () => void;
}

const LinksFilters: React.FC<LinksFiltersProps> = ({ searchQuery, onClearSearch }) => {
  const { t, language } = useLanguage();
  
  const { 
    categories,
    types,
    selectedCategory,
    selectedType,
    setSelectedCategory,
    setSelectedType
  } = useLinksFilters(searchQuery, language);

  // Clear all filters
  const handleClearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedType(null);
    onClearSearch();
  };

  return (
    <motion.div 
      className="mb-6"
      initial={{ opacity: 0, height: 0, overflow: "hidden" }}
      animate={{ opacity: 1, height: "auto", overflow: "visible" }}
      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-cosmic-900/60 border border-cosmic-700/40 rounded-lg p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-cosmic-100 flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            {t("Resource Types", "资源类型")}
          </h3>
          
          {selectedType && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearAllFilters}
              className="text-xs text-cosmic-400 hover:text-cosmic-100"
            >
              {t("Clear all filters", "清除所有过滤器")}
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(null)}
            className={`justify-start ${selectedType === null ? "bg-purple-600" : "bg-cosmic-800/50"}`}
          >
            <CirclePlus className="h-3.5 w-3.5 mr-2" />
            {t("All Types", "所有类型")}
          </Button>
          
          {types.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type === selectedType ? null : type)}
              className={`justify-start ${selectedType === type ? "bg-purple-600" : "bg-cosmic-800/50"}`}
            >
              <LineChart className="h-3.5 w-3.5 mr-2" />
              {language === 'en' ? type : translateType(type)}
            </Button>
          ))}
        </div>
        
        {/* Active filters */}
        {(selectedCategory || selectedType) && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-cosmic-900/40 rounded-lg border border-cosmic-700/20 mt-4">
            <span className="text-xs text-cosmic-400 mr-1">{t("Active filters:", "活动筛选器:")}</span>
            
            {selectedCategory && (
              <Badge variant="outline" className="bg-blue-900/30 border-blue-700/30 text-cosmic-200 flex items-center gap-1">
                {language === 'en' ? selectedCategory : translateCategory(selectedCategory)}
                <button 
                  className="ml-1 hover:text-cosmic-100" 
                  onClick={() => setSelectedCategory(null)}
                >
                  <CircleMinus className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {selectedType && (
              <Badge variant="outline" className="bg-purple-900/30 border-purple-700/30 text-cosmic-200 flex items-center gap-1">
                {language === 'en' ? selectedType : translateType(selectedType)}
                <button 
                  className="ml-1 hover:text-cosmic-100" 
                  onClick={() => setSelectedType(null)}
                >
                  <CircleMinus className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LinksFilters;
