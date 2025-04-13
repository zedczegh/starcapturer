
import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Link2, Filter, Grid, ListFilter, Layers, LayoutGrid } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { linksData } from "./linksData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LinksGrid = () => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  
  // Get unique categories and types for filtering
  const categories = useMemo(() => {
    const allCategories = new Set(linksData.map(link => link.category));
    return Array.from(allCategories);
  }, []);
  
  const types = useMemo(() => {
    const allTypes = new Set(linksData.map(link => link.type));
    return Array.from(allTypes);
  }, []);
  
  // Filter links based on selected category, type, and search query
  const filteredLinks = useMemo(() => {
    let filtered = [...linksData];
    
    if (selectedCategory) {
      filtered = filtered.filter(link => link.category === selectedCategory);
    }
    
    if (selectedType) {
      filtered = filtered.filter(link => link.type === selectedType);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(link => {
        const title = language === 'en' ? link.title.toLowerCase() : link.titleZh.toLowerCase();
        const description = language === 'en' ? link.description.toLowerCase() : link.descriptionZh.toLowerCase();
        const category = link.category.toLowerCase();
        const type = link.type.toLowerCase();
        
        return title.includes(query) || 
               description.includes(query) || 
               category.includes(query) || 
               type.includes(query) ||
               link.url.toLowerCase().includes(query);
      });
    }
    
    return filtered;
  }, [selectedCategory, selectedType, searchQuery, language]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  // Pass search state up to parent
  const handleClearSearch = () => {
    setSearchQuery("");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center sticky top-2 z-10 bg-cosmic-950/90 backdrop-blur-lg p-4 rounded-lg border border-cosmic-800/30 shadow-lg">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setViewMode('grid')}
            className={`${viewMode === 'grid' ? 'bg-cosmic-800 text-cosmic-100' : 'text-cosmic-400'}`}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            {!isMobile && t("Grid", "网格")}
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setViewMode('compact')}
            className={`${viewMode === 'compact' ? 'bg-cosmic-800 text-cosmic-100' : 'text-cosmic-400'}`}
          >
            <Layers className="h-4 w-4 mr-1" />
            {!isMobile && t("Compact", "紧凑")}
          </Button>
        </div>

        <div className="text-sm text-cosmic-400">
          {filteredLinks.length} {t("resources", "个资源")}
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-cosmic-900/80">
          <TabsTrigger value="categories" className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            {t("Categories", "类别")}
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-1.5">
            <ListFilter className="h-4 w-4" />
            {t("Resource Types", "资源类型")}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="mt-0">
          <div className="flex flex-wrap gap-2 mb-6 bg-cosmic-900/30 p-3 rounded-lg border border-cosmic-800/20">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? "bg-blue-600" : ""}
            >
              {t("All Categories", "所有类别")}
            </Button>
            
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                className={selectedCategory === category ? "bg-blue-600" : ""}
              >
                {language === 'en' ? category : translateCategory(category)}
              </Button>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="types" className="mt-0">
          <div className="flex flex-wrap gap-2 mb-6 bg-cosmic-900/30 p-3 rounded-lg border border-cosmic-800/20">
            <Button
              variant={selectedType === null ? "secondary" : "outline"}
              size="sm"
              onClick={() => setSelectedType(null)}
            >
              {t("All Types", "所有类型")}
            </Button>
            
            {types.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type === selectedType ? null : type)}
              >
                {language === 'en' ? type : translateType(type)}
              </Button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Active filters */}
      {(selectedCategory || selectedType || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-cosmic-900/40 rounded-lg border border-cosmic-700/20">
          <span className="text-xs text-cosmic-400">{t("Active filters:", "活动筛选器:")}</span>
          
          {selectedCategory && (
            <Badge variant="outline" className="bg-blue-900/30 border-blue-700/30 text-cosmic-200 flex items-center gap-1">
              {language === 'en' ? selectedCategory : translateCategory(selectedCategory)}
              <button 
                className="ml-1 hover:text-cosmic-100" 
                onClick={() => setSelectedCategory(null)}
              >
                ×
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
                ×
              </button>
            </Badge>
          )}
          
          {searchQuery && (
            <Badge variant="outline" className="bg-green-900/30 border-green-700/30 text-cosmic-200 flex items-center gap-1">
              "{searchQuery}"
              <button 
                className="ml-1 hover:text-cosmic-100" 
                onClick={handleClearSearch}
              >
                ×
              </button>
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSelectedCategory(null);
              setSelectedType(null);
              setSearchQuery("");
            }}
            className="text-xs ml-auto text-cosmic-400 hover:text-cosmic-100"
          >
            {t("Clear all", "清除所有")}
          </Button>
        </div>
      )}
      
      {/* Links Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${filteredLinks.length}`}
          className={`grid gap-4 ${
            viewMode === 'grid' 
              ? (isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3')
              : 'grid-cols-1'
          }`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredLinks.map((link, index) => (
            <motion.a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                ${viewMode === 'grid' 
                  ? 'bg-cosmic-900/60 border border-cosmic-700/30 rounded-lg p-4 hover:bg-cosmic-800/40 transition-all hover:border-cosmic-700/50 shadow-lg hover:shadow-xl'
                  : 'bg-cosmic-900/40 border border-cosmic-800/20 rounded-lg p-3 hover:bg-cosmic-800/30 transition-all flex flex-col md:flex-row md:items-center gap-2'
                }
              `}
              variants={itemVariants}
            >
              {viewMode === 'grid' ? (
                // Grid view
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs py-0.5 px-2 bg-cosmic-800/70 text-cosmic-300">
                        {language === 'en' ? link.type : translateType(link.type)}
                      </Badge>
                      <Badge variant="outline" className="text-xs py-0.5 px-2 bg-cosmic-800/70 text-cosmic-400">
                        {language === 'en' ? link.category : translateCategory(link.category)}
                      </Badge>
                    </div>
                    <ExternalLink className="h-3 w-3 text-cosmic-500 mt-1" />
                  </div>
                  
                  <h3 className="text-cosmic-100 font-medium mb-1">
                    {language === 'en' ? link.title : link.titleZh}
                  </h3>
                  
                  <p className="text-xs text-cosmic-400 mb-2">
                    {language === 'en' ? link.description : link.descriptionZh}
                  </p>
                  
                  <div className="text-xs text-cosmic-500 truncate bg-cosmic-900/80 p-1.5 rounded border border-cosmic-800/30">
                    {link.url}
                  </div>
                </>
              ) : (
                // Compact view
                <>
                  <div className="md:w-1/4">
                    <h3 className="text-sm text-cosmic-100 font-medium">
                      {language === 'en' ? link.title : link.titleZh}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-xs py-0 px-1 bg-cosmic-800/70 text-cosmic-400">
                        {language === 'en' ? link.category : translateCategory(link.category)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="md:w-2/4">
                    <p className="text-xs text-cosmic-400">
                      {language === 'en' ? link.description : link.descriptionZh}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between md:w-1/4 mt-1 md:mt-0">
                    <Badge variant="outline" className="text-xs py-0 px-1 bg-cosmic-800/70 text-cosmic-300">
                      {language === 'en' ? link.type : translateType(link.type)}
                    </Badge>
                    <ExternalLink className="h-3 w-3 text-cosmic-500" />
                  </div>
                </>
              )}
            </motion.a>
          ))}
        </motion.div>
      </AnimatePresence>
      
      {filteredLinks.length === 0 && (
        <motion.div 
          className="text-center py-10 bg-cosmic-900/30 rounded-lg border border-cosmic-800/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-cosmic-300">
            {t("No resources found with the selected filters.", "没有找到符合所选筛选条件的资源。")}
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Helper functions for translation
function translateCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    "Hardware": "硬件",
    "Software": "软件",
    "Tutorial": "教程",
    "Data": "数据",
    "Map": "地图",
    "Weather": "气象",
    "Forum": "论坛",
    "Observatory": "天文台",
    "Beginner": "新手",
    "Resource": "资源",
    "Game": "游戏",
    "Mobile": "移动应用",
    "Community": "社区"
  };
  return categoryMap[category] || category;
}

function translateType(type: string): string {
  const typeMap: Record<string, string> = {
    "Plugin": "插件",
    "Tutorial": "教程",
    "Map": "地图",
    "Weather": "气象",
    "Tool": "工具",
    "Light Pollution": "光污染",
    "Database": "数据库",
    "Forum": "论坛",
    "Rental": "租赁",
    "Freezing Camera": "冷冻相机",
    "Telescope": "望远镜",
    "Simulator": "模拟器",
    "Resource": "资源",
    "DIY": "DIY",
    "Review": "测评",
    "Open Source": "开源项目",
    "Gallery": "欣赏",
    "App": "应用",
    "Software": "软件",
    "Space Weather": "太空天气"
  };
  return typeMap[type] || type;
}

export default LinksGrid;
