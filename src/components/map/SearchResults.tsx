
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

  if (searchResults.length === 0 && searchTerm.length > 1 && !isLoading) {
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

  // Filter results based on current language to prevent mixed language display
  const filteredResults = searchResults.filter(result => {
    // For Chinese language mode, prefer results with Chinese characters
    if (language === 'zh') {
      return /[\u4e00-\u9fa5]/.test(result.name) || 
             (result.placeDetails && /[\u4e00-\u9fa5]/.test(result.placeDetails));
    }
    // For English mode, prefer results without Chinese characters
    return !/[\u4e00-\u9fa5]/.test(result.name);
  });

  // If filtering removed all results, show original results
  const resultsToShow = filteredResults.length > 0 ? filteredResults : searchResults;

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
