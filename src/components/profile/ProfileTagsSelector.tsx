
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
    <div className="space-y-3">
      <Label className="block text-white mb-2">{t("Profile Tags", "个人标签")}</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TAGS.map((tag) => (
          <label key={tag.value} className="flex items-center gap-2 cursor-pointer group">
            <Checkbox
              checked={selectedTags.includes(tag.value)}
              onCheckedChange={(checked) => onChange(tag.value, !!checked)}
              disabled={disabled}
              className="border-cosmic-400"
            />
            <div className="flex-1 flex">
              <ProfileTag tag={tag.value} />
            </div>
          </label>
        ))}
      </div>
      
      {selectedTags.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-cosmic-300 mb-2">
            {t("Selected tags:", "已选标签:")}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <div key={tag} className="animate-fadeIn">
                <ProfileTag tag={tag} animated />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTagsSelector;
