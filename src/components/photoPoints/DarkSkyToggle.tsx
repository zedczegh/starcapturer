
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
  
  return (
    <div className="flex items-center gap-3 bg-cosmic-800/40 p-3 rounded-lg border border-cosmic-700/20">
      <Switch 
        checked={showDarkSkyOnly}
        onCheckedChange={onToggle}
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
