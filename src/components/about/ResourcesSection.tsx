import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Book, Filter, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLinksFilters } from '@/hooks/useLinksFilters';
import { translateCategory, translateType } from '@/utils/linkTranslations';
import { LinkData } from '@/components/links/linksData';

const ResourcesSection: React.FC = () => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { 
    filteredLinks,
    selectedCategory,
    selectedType,
    totalLinks,
    setSelectedCategory,
    setSelectedType,
    categories,
    types
  } = useLinksFilters(searchQuery, language);

  const displayedLinks = isExpanded ? filteredLinks : filteredLinks.slice(0, 8);

  const handleClearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedType(null);
    setSearchQuery('');
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="mb-12"
    >
      <Card className="glassmorphism p-8 rounded-2xl border-cosmic-700/20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500/30 to-purple-500/20 rounded-xl shadow-lg shadow-blue-900/10">
            <Book className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-100 to-purple-200 bg-clip-text text-transparent">
              {t("Astronomy Resources", "天文资源")}
            </h2>
            <p className="text-cosmic-300 text-sm">
              {t("Curated collection of tools and resources", "精选的工具和资源集合")}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cosmic-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("Search resources...", "搜索资源...")}
                className="pl-10 bg-cosmic-900/50 border-cosmic-700/40 text-cosmic-100"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-cosmic-800/50 border-cosmic-700/40 hover:bg-cosmic-700/60"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t("Filters", "过滤器")}
              {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </div>

          {/* Filter Options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-3 p-4 bg-cosmic-900/30 rounded-lg border border-cosmic-700/20"
              >
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs"
                  >
                    {t("All Categories", "所有类别")}
                  </Button>
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="text-xs"
                    >
                      {language === 'en' ? category : translateCategory(category)}
                    </Button>
                  ))}
                </div>
                <div className="w-full border-t border-cosmic-700/20 pt-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedType === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(null)}
                      className="text-xs"
                    >
                      {t("All Types", "所有类型")}
                    </Button>
                    {types.map(type => (
                      <Button
                        key={type}
                        variant={selectedType === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType(type)}
                        className="text-xs"
                      >
                        {language === 'en' ? type : translateType(type)}
                      </Button>
                    ))}
                  </div>
                </div>
                {(selectedCategory || selectedType || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllFilters}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    {t("Clear All", "清除全部")}
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Count */}
        <div className="text-sm text-cosmic-400 mb-4">
          {t("Showing", "显示")} {displayedLinks.length} {t("of", "个资源，共")} {filteredLinks.length} {t("resources", "个")}
        </div>

        {/* Resources Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${searchQuery}-${selectedCategory}-${selectedType}-${isExpanded}`}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {displayedLinks.map((link, index) => (
              <ResourceCard key={`${link.url}-${index}`} link={link} language={language} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Show More/Less Button */}
        {filteredLinks.length > 8 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-cosmic-800/50 border-cosmic-700/40 hover:bg-cosmic-700/60"
            >
              {isExpanded 
                ? t("Show Less", "显示更少") 
                : t(`Show ${filteredLinks.length - 8} More`, `显示更多 ${filteredLinks.length - 8} 个`)}
              {isExpanded ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        )}

        {/* No Results */}
        {filteredLinks.length === 0 && (
          <motion.div 
            className="text-center py-8 text-cosmic-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="mb-4">{t("No resources found with the selected filters.", "没有找到符合所选筛选条件的资源。")}</p>
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
      </Card>
    </motion.section>
  );
};

interface ResourceCardProps {
  link: LinkData;
  language: string;
  index: number;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ link, language, index }) => {
  return (
    <motion.a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-cosmic-900/40 border border-cosmic-800/30 rounded-lg hover:bg-cosmic-800/40 hover:border-cosmic-700/50 transition-all duration-300 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge variant="outline" className="text-xs py-0.5 px-2 bg-blue-900/30 text-blue-300 border-blue-700/30">
          {language === 'en' ? link.category : translateCategory(link.category)}
        </Badge>
        <ExternalLink className="h-3 w-3 text-cosmic-500 group-hover:text-cosmic-300 transition-colors" />
      </div>
      
      <h3 className="text-sm font-medium text-cosmic-100 mb-2 group-hover:text-white transition-colors">
        {language === 'en' ? link.title : link.titleZh}
      </h3>
      
      <p className="text-xs text-cosmic-400 mb-3 line-clamp-2">
        {language === 'en' ? link.description : link.descriptionZh}
      </p>
      
      <div className="flex justify-between items-center">
        <Badge variant="outline" className="text-xs py-0.5 px-2 bg-purple-900/30 text-purple-300 border-purple-700/30">
          {language === 'en' ? link.type : translateType(link.type)}
        </Badge>
        
        <span className="text-xs text-cosmic-500 truncate max-w-[100px]">
          {new URL(link.url).hostname.replace('www.', '')}
        </span>
      </div>
    </motion.a>
  );
};

export default ResourcesSection;