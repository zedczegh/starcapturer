
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import MapMarker from "./MapMarker";
import { Location } from "../MapSelector";

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
  const { t } = useLanguage();

  if (searchResults.length === 0 && searchTerm.length > 2 && !isLoading) {
    return (
      <div className="px-3 py-6 text-sm text-center text-muted-foreground">
        {t("No locations found", "未找到位置")}
      </div>
    );
  }

  if (searchResults.length === 0) {
    return null;
  }

  return (
    <ul className="py-1 max-h-[60vh] overflow-y-auto">
      {searchResults.map((result, index) => (
        <MapMarker
          key={index}
          name={result.name}
          placeDetails={result.placeDetails}
          onClick={() => handleSelectLocation(result)}
        />
      ))}
    </ul>
  );
};

export default SearchResults;
