
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateProfileTag } from "@/utils/linkTranslations";
import ProfileTag from "./ProfileTag";

// Complete list of all available tags
const TAGS: { value: string; label: string }[] = [
  { value: "Professional Astronomer", label: "Professional Astronomer" },
  { value: "Amateur Astronomer", label: "Amateur Astronomer" },
  { value: "Star Gazer", label: "Star Gazer" },
  { value: "Meteorology Enthusiast", label: "Meteorology Enthusiast" },
  { value: "Cosmos Lover", label: "Cosmos Lover" },
  { value: "Traveler", label: "Traveler" },
  { value: "Dark Sky Volunteer", label: "Dark Sky Volunteer" },
  { value: "Nebulae Observer", label: "Nebulae Observer" },
  { value: "Astronomy Student", label: "Astronomy Student" },
  { value: "Planet Watcher", label: "Planet Watcher" },
  { value: "Telescope Maker", label: "Telescope Maker" },
  { value: "Astrophotographer", label: "Astrophotographer" },
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
      <Label className="block text-white mb-3 text-lg">{t("Profile Tags", "个人标签")}</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TAGS.map((tag) => (
          <label key={tag.value} className="flex items-start gap-6 cursor-pointer group py-2 px-3 rounded-md hover:bg-cosmic-800/20 transition-colors">
            <Checkbox
              checked={selectedTags.includes(tag.value)}
              onCheckedChange={(checked) => onChange(tag.value, !!checked)}
              disabled={disabled}
              className="border-cosmic-400 mt-1"
            />
            <div className="flex-1 flex">
              <ProfileTag tag={tag.value} />
            </div>
          </label>
        ))}
      </div>
      
      {selectedTags.length > 0 && (
        <div className="mt-6 p-4 bg-cosmic-800/30 border border-cosmic-700/20 rounded-lg">
          <p className="text-sm text-cosmic-300 mb-3">
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
