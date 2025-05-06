
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateType } from "@/utils/linkTranslations";

export const LOCATION_TYPES = [
  { name: "National/Academic Observatory", color: "#9b87f5" },
  { name: "Personal Observatory", color: "#0EA5E9" },
  { name: "Personal Favorite Observation Point", color: "#4ADE80" },
  { name: "Favored Observation Point of local hobby groups", color: "#FFD700" },
  { name: "Star Party venue", color: "#FFFF00" },
  { name: "Regular Camping Site", color: "#808000" },
  { name: "Astro Lodging", color: "#1A1F2C" }
];

interface LocationTypeSelectorProps {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
}

const LocationTypeSelector: React.FC<LocationTypeSelectorProps> = ({
  selectedTypes,
  onTypesChange,
}) => {
  const { t, language } = useLanguage();

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">
        {t("Location Types", "位置类型")}
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        {LOCATION_TYPES.map((type) => (
          <label
            key={type.name}
            className="flex items-center space-x-2 p-2 rounded border border-border hover:bg-accent/50 transition-colors"
            style={{ borderLeft: `4px solid ${type.color}` }}
          >
            <Checkbox
              checked={selectedTypes.includes(type.name)}
              onCheckedChange={(checked) => {
                onTypesChange(
                  checked
                    ? [...selectedTypes, type.name]
                    : selectedTypes.filter(t => t !== type.name)
                );
              }}
            />
            <span>
              {language === 'zh' ? translateType(type.name) : type.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default LocationTypeSelector;
