import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Moon, Mountain, Eye } from "lucide-react";

export type SpotType = 'nightscape' | 'natural' | 'obscura' | 'all';

interface SpotTypeFilterProps {
  activeType: SpotType;
  onTypeChange: (type: SpotType) => void;
}

const SpotTypeFilter: React.FC<SpotTypeFilterProps> = ({ activeType, onTypeChange }) => {
  const { t } = useLanguage();

  const spotTypes = [
    { value: 'all' as SpotType, label: t('All Spots', '全部地点'), icon: null },
    { value: 'nightscape' as SpotType, label: t('Nightscape', '夜景'), icon: Moon },
    { value: 'natural' as SpotType, label: t('Natural', '自然'), icon: Mountain },
    { value: 'obscura' as SpotType, label: t('Obscura', '奇观'), icon: Eye },
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-6">
      {spotTypes.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={activeType === value ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeChange(value)}
          className="transition-all"
        >
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          {label}
        </Button>
      ))}
    </div>
  );
};

export default SpotTypeFilter;
