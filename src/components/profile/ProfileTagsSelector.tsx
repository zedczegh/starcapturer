
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
}) => (
  <div className="space-y-3">
    <Label className="block text-white mb-2">Profile Tags</Label>
    <div className="flex flex-wrap gap-4">
      {TAGS.map((tag) => (
        <label key={tag.value} className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={selectedTags.includes(tag.value)}
            onCheckedChange={(checked) => onChange(tag.value, !!checked)}
            disabled={disabled}
          />
          <span className="text-sm text-cosmic-200">{tag.label}</span>
        </label>
      ))}
    </div>
  </div>
);

export default ProfileTagsSelector;
