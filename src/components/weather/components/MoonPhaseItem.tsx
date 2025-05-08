
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Moon, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  
  const getMoonPhaseQuality = (phase: string): string => {
    // New moon or crescent moons are best for astronomy
    if (phase.includes('New') || phase.includes('Crescent') || 
        phase.includes('新月') || phase.includes('眉月') || phase.includes('残月')) {
      return t("Good for astronomy", "适合天文观测");
    }
    // Full moon is worst for deep sky astronomy
    if (phase.includes('Full') || phase.includes('满月')) {
      return t("Bright - limits deep sky viewing", "明亮 - 限制深空观测");
    }
    // Quarter and Gibbous are moderate
    return t("Moderate brightness", "适中亮度");
  };
  
  const getMoonPhaseColorClass = (phase: string): string => {
    if (phase.includes('New') || phase.includes('Crescent') || 
        phase.includes('新月') || phase.includes('眉月') || phase.includes('残月')) {
      return "text-green-400";
    }
    if (phase.includes('Full') || phase.includes('满月')) {
      return "text-yellow-400";
    }
    return "text-blue-300";
  };
  
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-1">
        <Moon className="w-4 h-4 text-gray-300" />
        <div className="flex items-center">
          <span className="text-xs font-medium">{t("Moon Phase", "月相")}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 ml-1 text-cosmic-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-cosmic-800 border-cosmic-700">
              <p className="text-xs">
                {t("Current phase of the moon", "当前月相")}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-xs text-muted-foreground">{t('Phase', '相位')}</span>
        <span className="text-right text-sm font-medium text-cosmic-50">
          {translatedMoonPhase}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
        <span className="text-xs text-muted-foreground">{t('Impact', '影响')}</span>
        <span className={`text-right text-xs ${getMoonPhaseColorClass(moonPhase)}`}>
          {getMoonPhaseQuality(moonPhase)}
        </span>
      </div>
    </div>
  );
};

export default MoonPhaseItem;
