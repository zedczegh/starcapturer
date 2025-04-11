
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationSelectorProps {
  onLocationSelect: (place: any) => void;
  onUseCurrentLocation: () => void;
  loading?: boolean;
  noAutoLocationRequest?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationSelect,
  onUseCurrentLocation,
  loading = false,
  noAutoLocationRequest = false
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim() || isSearching) return;
    
    try {
      setIsSearching(true);
      
      // Mock search for demonstration
      setTimeout(() => {
        onLocationSelect({
          name: searchTerm,
          latitude: 0, // These would actually come from geocoding API
          longitude: 0
        });
        setIsSearching(false);
      }, 500);
    } catch (error) {
      console.error("Search error:", error);
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="flex space-x-2">
        <div className="relative flex-1">
          <Input
            placeholder={t("Search for a location", "搜索位置")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9 bg-background/50 focus:bg-background/80 transition-all border-cosmic-200/30"
            disabled={loading || isSearching}
          />
          {(loading || isSearching) && (
            <div className="absolute right-3 top-0 h-full flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <Button
          type="submit"
          variant="outline"
          size="icon"
          className={cn(
            "flex-shrink-0 bg-background/50 hover:bg-background/80",
            loading && "opacity-50 cursor-not-allowed"
          )}
          disabled={loading || isSearching}
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "flex-shrink-0 bg-background/50 hover:bg-background/80",
            (loading || noAutoLocationRequest) && "opacity-50 cursor-not-allowed"
          )}
          onClick={onUseCurrentLocation}
          disabled={loading || noAutoLocationRequest}
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default LocationSelector;
