
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateProfileTag } from "@/utils/linkTranslations";
import ProfileTag from "./ProfileTag";

const TAGS: { value: string; label: string }[] = [
  { value: "Professional Astronomer", label: "Professional Astronomer" },
  { value: "Amateur Astronomer", label: "Amateur Astronomer" },
  { value: "Astrophotographer", label: "Astrophotographer" },
  { value: "Meteorology Enthusiast", label: "Meteorology Enthusiast" },
  { value: "Cosmos Lover", label: "Cosmos Lover" },
  { value: "Traveler", label: "Traveler" },
  { value: "Dark Sky Volunteer", label: "Dark Sky Volunteer" },
];

interface ProfileTagsSelectorProps {
  selectedTags: string[];
  onChange: (tag: string, checked: boolean) => void;
  disabled?: boolean;
}

const ProfileTagsSelector: React.FC<ProfileTagsSelectorProps> = ({
  selectedTags,
  onChange,
  disabled = false,
}) => {
  const { t, language } = useLanguage();
  
  return (
    <div className="space-y-4">
      <Label className="block text-white mb-2">{t("Profile Tags", "个人标签")}</Label>
      
      {/* Preview of selected tags */}
      {selectedTags.length > 0 && (
        <div className="mb-4 p-3 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30">
          <p className="text-xs text-cosmic-400 mb-2">{t("Selected Tags", "已选标签")}:</p>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <ProfileTag key={tag} tag={tag} />
            ))}
          </div>
        </div>
      )}
      
      {/* Tag selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TAGS.map((tag) => (
          <div 
            key={tag.value}
            className={`
              flex items-center gap-2 p-2 rounded-md cursor-pointer
              ${selectedTags.includes(tag.value) ? 'bg-cosmic-800/60 border border-primary/30' : 'hover:bg-cosmic-800/30'}
              transition-all duration-200
            `}
            onClick={() => !disabled && onChange(tag.value, !selectedTags.includes(tag.value))}
          >
            <Checkbox
              checked={selectedTags.includes(tag.value)}
              onCheckedChange={(checked) => onChange(tag.value, !!checked)}
              disabled={disabled}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div className="flex flex-col">
              <span className="text-sm text-cosmic-200">
                {language === 'zh' ? translateProfileTag(tag.value) : tag.label}
              </span>
              
              {/* Show the tag badge example */}
              <div className="mt-1">
                <ProfileTag tag={tag.value} size="sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileTagsSelector;
