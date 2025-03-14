import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import MapMarker from "./MapMarker";
import { Location } from "../MapSelector";
import { Loader2 } from "lucide-react";

interface SearchResultsProps {
  searchResults: Location[];
  handleSelectLocation: (location: Location) => void;
  searchTerm: string;
  isLoading: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  searchResults,
  handleSelectLocation,
  searchTerm,
  isLoading,
}) => {
  const { t, language } = useLanguage();

  if (isLoading) {
    return (
      <div className="px-3 py-6 text-sm flex items-center justify-center">
        <Loader2 className="h-5 w-5 mr-2 animate-spin text-primary" />
        <span>{t("Searching locations...", "搜索位置中...")}</span>
      </div>
    );
  }

  if (searchResults.length === 0 && searchTerm.length > 0 && !isLoading) {
    return (
      <div className="px-3 py-6 text-sm text-center text-muted-foreground border-t border-border/30">
        {t("No locations found", "未找到位置")}
        <div className="mt-1 text-xs text-muted-foreground">
          {t("Try a different spelling or location", "尝试不同的拼写或位置")}
        </div>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return null;
  }

  // Improved language filtering
  const filteredResults = searchResults.filter(result => {
    const name = result.name || '';
    const details = result.placeDetails || '';
    
    // For Chinese language mode
    if (language === 'zh') {
      // Keep results with Chinese characters in name or details
      const hasChinese = /[\u4e00-\u9fa5]/.test(name) || /[\u4e00-\u9fa5]/.test(details);
      
      // Also accept if the name is in Chinese pinyin but details have Chinese characters
      const hasChineseInDetails = /[\u4e00-\u9fa5]/.test(details);
      
      return hasChinese || hasChineseInDetails;
    } 
    // For English mode
    else {
      // Exclude results with significant Chinese character presence
      const nameChineseRatio = (name.match(/[\u4e00-\u9fa5]/g) || []).length / name.length;
      const detailsChineseRatio = (details.match(/[\u4e00-\u9fa5]/g) || []).length / (details.length || 1);
      
      // Accept if name is mostly non-Chinese or if details are mostly non-Chinese
      return nameChineseRatio < 0.3 || detailsChineseRatio < 0.3;
    }
  });

  // If filtering removed all results, show a subset of the original results
  // that best matches the current language
  const resultsToShow = filteredResults.length > 0 ? filteredResults : 
    searchResults.slice(0, 3).map(result => {
      // For English mode, attempt to remove Chinese characters from display
      if (language === 'en') {
        const name = result.name.replace(/[\u4e00-\u9fa5]/g, '').trim() || result.name;
        const placeDetails = result.placeDetails?.replace(/[\u4e00-\u9fa5]/g, '').trim() || result.placeDetails;
        return { ...result, name, placeDetails };
      }
      return result;
    });

  return (
    <ul className="py-1 max-h-[60vh] overflow-y-auto divide-y divide-border/20">
      {resultsToShow.map((result, index) => (
        <MapMarker
          key={`${result.name}-${index}`}
          name={result.name}
          placeDetails={result.placeDetails}
          onClick={() => handleSelectLocation(result)}
        />
      ))}
    </ul>
  );
};

export default SearchResults;
