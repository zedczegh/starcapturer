
import React, { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

interface LocationSearchProps {
  onLocationSelected: (location: any) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Location search component with geocoding functionality
 */
const LocationSearch: React.FC<LocationSearchProps> = ({ 
  onLocationSelected, 
  placeholder,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useLanguage();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    try {
      // Use Nominatim for geocoding (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchTerm
        )}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error("Geocoding request failed");
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = {
          name: data[0].display_name,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
        
        onLocationSelected(location);
        setSearchTerm("");
      } else {
        console.log("No results found for:", searchTerm);
      }
    } catch (error) {
      console.error("Error searching for location:", error);
    }
  }, [searchTerm, onLocationSelected]);
  
  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder || t("Search for a location", "搜索位置")}
          className="pl-10 pr-4 py-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </form>
  );
};

export default LocationSearch;
