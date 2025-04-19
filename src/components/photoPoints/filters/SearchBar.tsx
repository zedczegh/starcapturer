
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, className = '' }) => {
  const { t } = useLanguage();
  
  return (
    <div className={`relative ${className}`}>
      <Input
        type="text"
        placeholder={t("Search dark sky locations...", "搜索暗夜地点...")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-8 focus:ring-2 focus:ring-primary/30"
      />
      <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
};

export default SearchBar;
