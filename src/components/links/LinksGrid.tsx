
import React, { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { linksData } from "./linksData";
import { Button } from "@/components/ui/button";

const LinksGrid = () => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // Get unique categories and types for filtering
  const categories = useMemo(() => {
    const allCategories = new Set(linksData.map(link => link.category));
    return Array.from(allCategories);
  }, []);
  
  const types = useMemo(() => {
    const allTypes = new Set(linksData.map(link => link.type));
    return Array.from(allTypes);
  }, []);
  
  // Filter links based on selected category and type
  const filteredLinks = useMemo(() => {
    let filtered = [...linksData];
    
    if (selectedCategory) {
      filtered = filtered.filter(link => link.category === selectedCategory);
    }
    
    if (selectedType) {
      filtered = filtered.filter(link => link.type === selectedType);
    }
    
    return filtered;
  }, [selectedCategory, selectedType]);
  
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
  
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
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
      
      {/* Resource types filter */}
      <div className="flex flex-wrap gap-2 mb-8">
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
      
      {/* Links Grid */}
      <motion.div
        className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}
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
            className="bg-cosmic-900/60 border border-cosmic-700/30 rounded-lg p-4 hover:bg-cosmic-800/40 transition-all hover:border-cosmic-700/50"
            variants={itemVariants}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <span className="text-xs py-1 px-2 bg-cosmic-800/70 rounded-full text-cosmic-300 mr-2">
                  {language === 'en' ? link.type : translateType(link.type)}
                </span>
                <span className="text-xs py-1 px-2 bg-cosmic-800/70 rounded-full text-cosmic-400">
                  {language === 'en' ? link.category : translateCategory(link.category)}
                </span>
              </div>
              <ExternalLink className="h-3 w-3 text-cosmic-500" />
            </div>
            
            <h3 className="text-cosmic-100 font-medium mb-1">
              {language === 'en' ? link.title : link.titleZh}
            </h3>
            
            <p className="text-xs text-cosmic-400 mb-2">
              {language === 'en' ? link.description : link.descriptionZh}
            </p>
            
            <div className="text-xs text-cosmic-500 truncate">
              {link.url}
            </div>
          </motion.a>
        ))}
      </motion.div>
      
      {filteredLinks.length === 0 && (
        <div className="text-center py-10">
          <p className="text-cosmic-300">
            {t("No resources found with the selected filters.", "没有找到符合所选筛选条件的资源。")}
          </p>
        </div>
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
  };
  return typeMap[type] || type;
}

export default LinksGrid;
