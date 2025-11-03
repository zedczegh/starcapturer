
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Star, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import LinksHeader from "@/components/links/LinksHeader";
import LinksGrid from "@/components/links/LinksGrid";
import LinksFooter from "@/components/links/LinksFooter";
import LinksFilters from "@/components/links/LinksFilters";
import NavBar from "@/components/NavBar";

const UsefulLinks = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    // Set page title
    document.title = t("Astronomy Resources - Meteotinary", "天文资源 - 趣小众");
    
    // Auto-show filters if there's a search query
    if (searchQuery) {
      setFiltersVisible(true);
    }
  }, [t, searchQuery]);
  
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };
  
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  return (
    <div className="min-h-screen bg-cosmic-950 text-cosmic-50 pb-20 relative overflow-hidden">
      <NavBar />
      {/* Background stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            initial={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              height: `${Math.random() * 3 + 1}px`,
              width: `${Math.random() * 3 + 1}px`,
              opacity: Math.random() * 0.5 + 0.3
            }}
            animate={{
              opacity: [
                Math.random() * 0.5 + 0.3,
                Math.random() * 0.8 + 0.5,
                Math.random() * 0.5 + 0.3
              ]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
        
        {/* Background gradient orbs */}
        <motion.div 
          className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl"
          animate={{
            y: [0, 15, 0],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
        />
        
        <motion.div 
          className="absolute -bottom-32 -left-20 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl"
          animate={{
            y: [0, -15, 0],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{ duration: 7, repeat: Infinity, repeatType: "reverse" }}
        />
        
        {/* Additional background element */}
        <motion.div 
          className="absolute top-1/3 left-1/4 w-64 h-64 bg-indigo-600/5 rounded-full filter blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
        />
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12 relative z-10 pt-20">
        <div className="flex items-center mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mr-2 text-cosmic-200 hover:text-cosmic-50 hover:bg-cosmic-800/50">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              {t("Back", "返回")}
            </Button>
          </Link>
          
          {!isMobile && (
            <motion.div
              className="ml-auto flex items-center text-cosmic-300 text-sm gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Star className="h-3 w-3 text-yellow-400" />
              {t("Regularly Updated", "定期更新")}
              <span className="mx-2 text-cosmic-600">•</span>
              <Calendar className="h-3 w-3 text-blue-400" />
              {t("Last Updated: April 2025", "最近更新: 2025年4月")}
            </motion.div>
          )}
        </div>
        
        <LinksHeader 
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          onToggleFilters={toggleFilters}
          filtersVisible={filtersVisible}
        />
        
        {filtersVisible && (
          <LinksFilters 
            searchQuery={searchQuery}
            onClearSearch={handleClearSearch}
          />
        )}
        
        <LinksGrid 
          searchQuery={searchQuery} 
          onClearSearch={handleClearSearch}
        />
        
        <LinksFooter />
      </div>
    </div>
  );
};

export default UsefulLinks;
