
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Layers, List, Filter, Search, CircleMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLinksFilters } from "@/hooks/useLinksFilters";
import { translateType, translateCategory } from "@/utils/linkTranslations";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    filteredLinks,
    totalLinks,
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
            <Filter className="h-4 w-4 text-blue-400" />
            {t("Filter Resources", "筛选资源")}
          </h3>
          
          {(selectedType || selectedCategory || searchQuery) && (
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

        <div className="space-y-6">
          {/* Categories filter */}
          <div>
            <h4 className="text-sm text-cosmic-300 mb-2 flex items-center gap-1">
              <List className="h-3.5 w-3.5" />
              {t("Categories", "类别")}
              {selectedCategory && (
                <Badge variant="outline" className="ml-2 bg-blue-900/30 border-blue-700/30 text-cosmic-200">
                  1 {t("selected", "已选择")}
                </Badge>
              )}
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                  className={`justify-start text-xs h-8 ${selectedCategory === category ? "bg-blue-600" : "bg-cosmic-800/50"}`}
                >
                  {language === 'en' ? category : translateCategory(category)}
                </Button>
              ))}
            </div>
          </div>

          {/* Types filter */}
          <div>
            <h4 className="text-sm text-cosmic-300 mb-2 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {t("Resource Types", "资源类型")}
              {selectedType && (
                <Badge variant="outline" className="ml-2 bg-purple-900/30 border-purple-700/30 text-cosmic-200">
                  1 {t("selected", "已选择")}
                </Badge>
              )}
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {types.map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type === selectedType ? null : type)}
                  className={`justify-start text-xs h-8 ${selectedType === type ? "bg-purple-600" : "bg-cosmic-800/50"}`}
                >
                  {language === 'en' ? type : translateType(type)}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Active filters */}
        {(selectedCategory || selectedType || searchQuery) && (
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
            
            {searchQuery && (
              <Badge variant="outline" className="bg-green-900/30 border-green-700/30 text-cosmic-200 flex items-center gap-1">
                "{searchQuery}"
                <button 
                  className="ml-1 hover:text-cosmic-100" 
                  onClick={onClearSearch}
                >
                  <CircleMinus className="h-3 w-3" />
                </button>
              </Badge>
            )}

            <span className="ml-auto text-xs text-cosmic-400">
              {filteredLinks.length} / {totalLinks} {t("resources shown", "个资源显示")}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LinksFilters;
