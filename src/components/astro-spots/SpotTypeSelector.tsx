import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Moon, Mountain, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SpotType = 'nightscape' | 'natural' | 'obscura';

interface SpotTypeSelectorProps {
  value: SpotType;
  onChange: (value: SpotType) => void;
}

const SpotTypeSelector: React.FC<SpotTypeSelectorProps> = ({ value, onChange }) => {
  const { t } = useLanguage();

  const spotTypes = [
    { value: 'nightscape' as SpotType, label: t('Nightscape Spot', '夜景点'), icon: Moon },
    { value: 'natural' as SpotType, label: t('Natural Spot', '自然景点'), icon: Mountain },
    { value: 'obscura' as SpotType, label: t('Obscura Spot', '奇观点'), icon: Eye },
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t('Select spot type', '选择地点类型')} />
      </SelectTrigger>
      <SelectContent>
        {spotTypes.map(({ value, label, icon: Icon }) => (
          <SelectItem key={value} value={value}>
            <div className="flex items-center">
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SpotTypeSelector;
