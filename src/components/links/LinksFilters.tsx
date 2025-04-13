
import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Layers, CircleDot, CirclePlus, CircleMinus, LayoutGrid, LineChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLinksFilters } from "@/hooks/useLinksFilters";
import { translateCategory, translateType } from "@/utils/linkTranslations";

const LinksFilters = () => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  
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
            {t("Resource Filters", "资源过滤器")}
          </h3>
          
          {(selectedCategory || selectedType) && (
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
        
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-cosmic-900/80">
            <TabsTrigger value="categories" className="flex items-center gap-1.5">
              <CircleDot className="h-4 w-4" />
              {t("Categories", "类别")}
            </TabsTrigger>
            <TabsTrigger value="types" className="flex items-center gap-1.5">
              <LineChart className="h-4 w-4" />
              {t("Resource Types", "资源类型")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={`justify-start ${selectedCategory === null ? "bg-blue-600" : "bg-cosmic-800/50"}`}
              >
                <CirclePlus className="h-3.5 w-3.5 mr-2" />
                {t("All Categories", "所有类别")}
              </Button>
              
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                  className={`justify-start ${selectedCategory === category ? "bg-blue-600" : "bg-cosmic-800/50"}`}
                >
                  <CircleDot className="h-3.5 w-3.5 mr-2" />
                  {language === 'en' ? category : translateCategory(category)}
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="types" className="mt-0">
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
                  <CircleDot className="h-3.5 w-3.5 mr-2" />
                  {language === 'en' ? type : translateType(type)}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
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
