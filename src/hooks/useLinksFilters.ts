
import { useState, useMemo } from 'react';
import { linksData, LinkData } from '@/components/links/linksData';

export type LinkCategory = string | null;
export type LinkType = string | null;
export type LinkViewMode = 'grid' | 'compact';

export interface LinkFilters {
  categories: string[];
  types: string[];
  selectedCategory: LinkCategory;
  selectedType: LinkType;
  filteredLinks: LinkData[];
  setSelectedCategory: (category: LinkCategory) => void;
  setSelectedType: (type: LinkType) => void;
}

export const useLinksFilters = (searchQuery: string, language: string): LinkFilters => {
  const [selectedCategory, setSelectedCategory] = useState<LinkCategory>(null);
  const [selectedType, setSelectedType] = useState<LinkType>(null);
  
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
  
  return {
    categories,
    types,
    selectedCategory,
    selectedType,
    filteredLinks,
    setSelectedCategory,
    setSelectedType
  };
};
