
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Moon } from "lucide-react";

const MOON_PHASE_TRANSLATIONS = {
  'en': {
    'New Moon': 'New Moon',
    'Waxing Crescent': 'Waxing Crescent',
    'First Quarter': 'First Quarter',
    'Waxing Gibbous': 'Waxing Gibbous',
    'Full Moon': 'Full Moon',
    'Waning Gibbous': 'Waning Gibbous',
    'Last Quarter': 'Last Quarter',
    'Waning Crescent': 'Waning Crescent'
  },
  'zh': {
    'New Moon': '新月',
    'Waxing Crescent': '娥眉月',
    'First Quarter': '上弦月',
    'Waxing Gibbous': '盈凸月',
    'Full Moon': '满月',
    'Waning Gibbous': '亏凸月',
    'Last Quarter': '下弦月',
    'Waning Crescent': '残月'
  }
};

interface MoonPhaseItemProps {
  moonPhase: string;
  language: 'en' | 'zh';
}

const MoonPhaseItem: React.FC<MoonPhaseItemProps> = ({ moonPhase, language }) => {
  const { t } = useLanguage();
  const translatedMoonPhase = MOON_PHASE_TRANSLATIONS[language][moonPhase] || moonPhase;
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-cosmic-700/40 mr-3">
          <Moon className="h-5 w-5 text-cosmic-200" />
        </div>
        <span className="font-medium">{t("Moon Phase", "月相")}</span>
      </div>
      <span className="font-bold text-lg text-cosmic-50">
        {translatedMoonPhase}
      </span>
    </div>
  );
};

export default MoonPhaseItem;
