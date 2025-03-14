
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Location } from "@/services/geocoding/types";

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
  isLoading
}) => {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (searchResults.length === 0 && searchTerm.length > 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>{t("No locations found", "未找到位置")}</p>
        <p className="text-sm mt-1">
          {t("Try a different search term", "尝试使用不同的搜索词")}
        </p>
      </div>
    );
  }

  if (searchTerm.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>{t("Start typing to search", "开始输入以搜索")}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[300px] overflow-auto">
      <div className="py-1">
        {searchResults.map((location, index) => (
          <div
            key={`${location.name}-${index}`}
            className="px-3 py-2 hover:bg-slate-800/40 transition-colors cursor-pointer flex items-start gap-2"
            onClick={() => handleSelectLocation(location)}
          >
            <MapPin className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium leading-tight">{location.name}</p>
              {location.placeDetails && (
                <p className="text-xs text-muted-foreground mt-0.5">{location.placeDetails}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default SearchResults;
