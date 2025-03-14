
import React, { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SearchInputProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
  clearSearch: () => void;
  className?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  searchTerm,
  setSearchTerm,
  isLoading,
  clearSearch,
  className = "",
  autoFocus = false,
  onFocus
}) => {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Auto-focus the input when requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  return (
    <div className={`relative ${className}`}>
      <Input 
        ref={inputRef}
        type="text" 
        placeholder={t("Search for a location...", "搜索位置...")} 
        value={searchTerm} 
        onChange={handleSearchInputChange} 
        onFocus={onFocus}
        className="w-full pr-10 hover-card transition-colors focus:placeholder-transparent rounded-lg bg-slate-800" 
        autoFocus={autoFocus}
      />
      
      {searchTerm ? (
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" 
          onClick={clearSearch}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : (
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      )}
      
      {isLoading && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default SearchInput;
