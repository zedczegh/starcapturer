
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DarkSkyToggleProps {
  showDarkSkyOnly: boolean;
  onToggle: (value: boolean) => void;
}

const DarkSkyToggle: React.FC<DarkSkyToggleProps> = ({ showDarkSkyOnly, onToggle }) => {
  const { t } = useLanguage();
  
  const handleToggle = (checked: boolean) => {
    onToggle(checked);
    
    // Store preference in localStorage
    try {
      localStorage.setItem('dark_sky_only_preference', JSON.stringify(checked));
    } catch (error) {
      console.error("Error saving dark sky preference:", error);
    }
  };
  
  // Extra safeguard to load preference
  React.useEffect(() => {
    try {
      const savedPreference = localStorage.getItem('dark_sky_only_preference');
      if (savedPreference !== null) {
        const parsedPreference = JSON.parse(savedPreference);
        if (typeof parsedPreference === 'boolean' && parsedPreference !== showDarkSkyOnly) {
          onToggle(parsedPreference);
        }
      }
    } catch (error) {
      console.error("Error loading dark sky preference:", error);
    }
  }, []);
  
  return (
    <div className="flex items-center gap-3 bg-cosmic-800/40 p-3 rounded-lg border border-cosmic-700/20">
      <Switch 
        checked={showDarkSkyOnly}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-blue-600"
      />
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4 text-blue-400" fill={showDarkSkyOnly ? "rgba(96, 165, 250, 0.2)" : "none"} />
        <span className="text-sm font-medium text-primary-foreground/90">
          {t("Show only Dark Sky locations", "仅显示暗夜区域")}
        </span>
      </div>
    </div>
  );
};

export default DarkSkyToggle;
