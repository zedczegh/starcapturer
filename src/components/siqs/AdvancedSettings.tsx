
import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import BortleScaleSelector from "./BortleScaleSelector";
import SeeingSelector from "./SeeingSelector";

interface AdvancedSettingsProps {
  showAdvancedSettings: boolean;
  setShowAdvancedSettings: (show: boolean) => void;
  bortleScale: number;
  setBortleScale: (value: number) => void;
  seeingConditions: number;
  setSeeingConditions: (value: number) => void;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  showAdvancedSettings,
  setShowAdvancedSettings,
  bortleScale,
  setBortleScale,
  seeingConditions,
  setSeeingConditions
}) => {
  const { t } = useLanguage();
  
  return (
    <Collapsible
      open={showAdvancedSettings}
      onOpenChange={setShowAdvancedSettings}
      className="space-y-2"
    >
      <CollapsibleTrigger asChild>
        <button className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
          {t("Advanced Settings", "高级设置")}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-2">
        <BortleScaleSelector 
          bortleScale={bortleScale} 
          setBortleScale={setBortleScale} 
        />
        <SeeingSelector 
          seeingConditions={seeingConditions} 
          setSeeingConditions={setSeeingConditions} 
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AdvancedSettings;
