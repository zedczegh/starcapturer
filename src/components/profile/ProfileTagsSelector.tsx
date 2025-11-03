
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateProfileTag } from "@/utils/linkTranslations";
import ProfileTag from "./ProfileTag";

// Complete list of all available tags
const TAGS: { value: string; label: string }[] = [
  // Astronomy tags
  { value: "Professional Astronomer", label: "Professional Astronomer" },
  { value: "Amateur Astronomer", label: "Amateur Astronomer" },
  { value: "Star Gazer", label: "Star Gazer" },
  { value: "Astrophotographer", label: "Astrophotographer" },
  { value: "Cosmos Lover", label: "Cosmos Lover" },
  { value: "Planet Watcher", label: "Planet Watcher" },
  { value: "Nebulae Observer", label: "Nebulae Observer" },
  { value: "Telescope Maker", label: "Telescope Maker" },
  { value: "Astronomy Student", label: "Astronomy Student" },
  { value: "Dark Sky Volunteer", label: "Dark Sky Volunteer" },
  
  // Outdoor & Nature tags
  { value: "Mountaineer", label: "Mountaineer" },
  { value: "Hiker", label: "Hiker" },
  { value: "Rock Climber", label: "Rock Climber" },
  { value: "Camper", label: "Camper" },
  { value: "Nature Photographer", label: "Nature Photographer" },
  { value: "Wildlife Observer", label: "Wildlife Observer" },
  { value: "Trail Runner", label: "Trail Runner" },
  { value: "Backpacker", label: "Backpacker" },
  { value: "Adventure Seeker", label: "Adventure Seeker" },
  { value: "Outdoor Enthusiast", label: "Outdoor Enthusiast" },
  { value: "Desert Explorer", label: "Desert Explorer" },
  { value: "Alpine Climber", label: "Alpine Climber" },
  
  // Weather & Exploration
  { value: "Meteorology Enthusiast", label: "Meteorology Enthusiast" },
  { value: "Storm Chaser", label: "Storm Chaser" },
  { value: "Aurora Hunter", label: "Aurora Hunter" },
  { value: "Traveler", label: "Traveler" },
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-white text-lg font-semibold">{t("Profile Tags", "个人标签")}</Label>
        <div className="text-sm text-cosmic-400">
          {selectedTags.length}/28 {t("selected", "已选择")}
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-cosmic-800/20 to-cosmic-900/20 p-6 rounded-xl border border-cosmic-700/20 backdrop-blur-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TAGS.map((tag) => (
            <label 
              key={tag.value} 
              className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-cosmic-700/20 transition-all duration-200 border border-transparent hover:border-cosmic-600/30"
            >
              <Checkbox
                checked={selectedTags.includes(tag.value)}
                onCheckedChange={(checked) => onChange(tag.value, !!checked)}
                disabled={disabled}
                className="border-cosmic-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <div className="flex-1">
                <ProfileTag tag={tag.value} size="sm" />
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {selectedTags.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-[#8A6FD6]/5 p-5 rounded-xl border border-primary/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <p className="text-sm font-medium text-primary">
              {t("Your selected outdoor interests:", "您选择的户外兴趣:")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <div key={tag} className="animate-scale-in">
                <ProfileTag tag={tag} animated size="md" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTagsSelector;
