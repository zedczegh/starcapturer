import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Moon, Mountain, Eye, Layers } from "lucide-react";
import { CircularTabs } from "@/components/ui/circular-tabs";

export type SpotType = 'nightscape' | 'natural' | 'obscura' | 'all';

interface CircularSpotTypeFilterProps {
  activeType: SpotType;
  onTypeChange: (type: SpotType) => void;
  counts?: {
    all: number;
    nightscape: number;
    natural: number;
    obscura: number;
  };
}

const CircularSpotTypeFilter: React.FC<CircularSpotTypeFilterProps> = ({ 
  activeType, 
  onTypeChange,
  counts
}) => {
  const { t } = useLanguage();

  const spotTypeTabs = [
    { value: 'all' as SpotType, label: t('All Spots', '全部地点'), icon: Layers, count: counts?.all },
    { value: 'nightscape' as SpotType, label: t('Nightscape', '夜景'), icon: Moon, count: counts?.nightscape },
    { value: 'natural' as SpotType, label: t('Natural', '自然'), icon: Mountain, count: counts?.natural },
    { value: 'obscura' as SpotType, label: t('Obscura', '奇观'), icon: Eye, count: counts?.obscura },
  ];

  return (
    <CircularTabs 
      tabs={spotTypeTabs}
      activeTab={activeType}
      onTabChange={(value) => onTypeChange(value as SpotType)}
      className="mb-6"
    />
  );
};

export default CircularSpotTypeFilter;
