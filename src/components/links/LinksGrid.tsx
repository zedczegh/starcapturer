
import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, LayoutGrid, Layers } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { LinkData } from "./linksData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkViewMode, useLinksFilters } from "@/hooks/useLinksFilters";
import { translateCategory, translateType } from "@/utils/linkTranslations";

interface LinksGridProps {
  searchQuery: string;
  onClearSearch: () => void;
}

const LinksGrid: React.FC<LinksGridProps> = ({ searchQuery, onClearSearch }) => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<LinkViewMode>('grid');
  
  const { 
    filteredLinks,
    selectedCategory,
    selectedType,
    setSelectedCategory,
    setSelectedType
  } = useLinksFilters(searchQuery, language);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
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

  // Clear all filters
  const handleClearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedType(null);
    onClearSearch();
  };
  
  return (
    <div className="space-y-6">
      {/* View mode toggle */}
      <div className="flex items-center justify-between sticky top-2 z-10 bg-cosmic-950/90 backdrop-blur-lg p-4 rounded-lg border border-cosmic-800/30 shadow-lg">
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
      
      {/* Active search filter */}
      {searchQuery && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-cosmic-900/40 rounded-lg border border-cosmic-700/20">
          <span className="text-xs text-cosmic-400 mr-1">{t("Search:", "搜索:")}</span>
          <Badge variant="outline" className="bg-green-900/30 border-green-700/30 text-cosmic-200 flex items-center gap-1">
            "{searchQuery}"
            <button 
              className="ml-1 hover:text-cosmic-100" 
              onClick={onClearSearch}
            >
              ×
            </button>
          </Badge>
          
          {(searchQuery && (selectedCategory || selectedType)) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearAllFilters}
              className="text-xs ml-auto text-cosmic-400 hover:text-cosmic-100"
            >
              {t("Clear all", "清除所有")}
            </Button>
          )}
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
            <LinkCard 
              key={index} 
              link={link} 
              viewMode={viewMode} 
              language={language}
              index={index}
              itemVariants={itemVariants}
            />
          ))}
        </motion.div>
      </AnimatePresence>
      
      {filteredLinks.length === 0 && (
        <motion.div 
          className="text-center py-10 bg-cosmic-900/30 rounded-lg border border-cosmic-800/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-cosmic-300 mb-2">
            {t("No resources found with the selected filters.", "没有找到符合所选筛选条件的资源。")}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAllFilters}
            className="bg-cosmic-800/40 text-cosmic-200 hover:bg-cosmic-700/60"
          >
            {t("Clear all filters", "清除所有过滤器")}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

interface LinkCardProps {
  link: LinkData;
  viewMode: LinkViewMode;
  language: string;
  index: number;
  itemVariants: any;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, viewMode, language, index, itemVariants }) => {
  return (
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
        <GridViewCard link={link} language={language} />
      ) : (
        <CompactViewCard link={link} language={language} />
      )}
    </motion.a>
  );
};

const GridViewCard: React.FC<{ link: LinkData, language: string }> = ({ link, language }) => (
  <>
    <div className="flex justify-between items-start mb-2">
      <Badge variant="outline" className="text-xs py-0.5 px-2 bg-blue-900/30 text-blue-300 border-blue-700/30">
        {language === 'en' ? link.category : translateCategory(link.category)}
      </Badge>
      <ExternalLink className="h-3 w-3 text-cosmic-500 mt-1" />
    </div>
    
    <h3 className="text-cosmic-100 font-medium mb-1">
      {language === 'en' ? link.title : link.titleZh}
    </h3>
    
    <p className="text-xs text-cosmic-400 mb-2">
      {language === 'en' ? link.description : link.descriptionZh}
    </p>
    
    <div className="flex justify-between items-center mt-2">
      <Badge variant="outline" className="text-xs py-0.5 px-2 bg-purple-900/30 text-purple-300 border-purple-700/30">
        {language === 'en' ? link.type : translateType(link.type)}
      </Badge>
      
      <span className="text-xs text-cosmic-500 truncate max-w-[150px]">
        {new URL(link.url).hostname.replace('www.', '')}
      </span>
    </div>
  </>
);

const CompactViewCard: React.FC<{ link: LinkData, language: string }> = ({ link, language }) => (
  <>
    <div className="md:w-1/4">
      <h3 className="text-sm text-cosmic-100 font-medium">
        {language === 'en' ? link.title : link.titleZh}
      </h3>
      <div className="flex items-center gap-1 mt-1">
        <Badge variant="outline" className="text-xs py-0 px-1 bg-blue-900/30 text-blue-300 border-blue-700/30">
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
      <Badge variant="outline" className="text-xs py-0 px-1 bg-purple-900/30 text-purple-300 border-purple-700/30">
        {language === 'en' ? link.type : translateType(link.type)}
      </Badge>
      <ExternalLink className="h-3 w-3 text-cosmic-500" />
    </div>
  </>
);

export default LinksGrid;
