
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateCategory } from "@/utils/linkTranslations";

export const LOCATION_ADVANTAGES = [
  "Low Light Pollution Region",
  "Low Air Pollution Region",
  "Lodging available",
  "Stable and Low Wind Gusts",
  "High Annual Clear Nights Rate(>100 Days a year)",
  "Far enough away from waters",
  "Good Viewing Conditions",
  "Parking available",
  "Well-paved roads to location",
  "No local interruptions",
  "Hard Soil or Concrete floor",
  "Power supplies available",
  "Mobile battery available", 
  "Wi-Fi available",
  "Friendly host"
];

interface LocationAdvantagesSelectorProps {
  selectedAdvantages: string[];
  onAdvantagesChange: (advantages: string[]) => void;
}

const LocationAdvantagesSelector: React.FC<LocationAdvantagesSelectorProps> = ({
  selectedAdvantages,
  onAdvantagesChange,
}) => {
  const { t, language } = useLanguage();

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">
        {t("Location Advantages", "位置优势")}
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        {LOCATION_ADVANTAGES.map((advantage) => (
          <label
            key={advantage}
            className="flex items-center space-x-2 p-2 rounded border border-border hover:bg-accent/50 transition-colors"
          >
            <Checkbox
              checked={selectedAdvantages.includes(advantage)}
              onCheckedChange={(checked) => {
                onAdvantagesChange(
                  checked
                    ? [...selectedAdvantages, advantage]
                    : selectedAdvantages.filter(a => a !== advantage)
                );
              }}
            />
            <span>
              {language === 'zh' ? translateCategory(advantage) : advantage}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default LocationAdvantagesSelector;
