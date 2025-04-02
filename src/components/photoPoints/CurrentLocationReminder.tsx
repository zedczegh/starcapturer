
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CurrentLocationReminderProps {
  hasLocation: boolean;
}

const CurrentLocationReminder: React.FC<CurrentLocationReminderProps> = ({ hasLocation }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  if (hasLocation) {
    return null;
  }
  
  return (
    <div className="bg-cosmic-900/50 backdrop-blur-sm px-4 py-3 rounded-lg border border-amber-500/20 shadow-md mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-amber-400 h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-sm text-amber-100/90">
            {t(
              "For more accurate results, please enable location sharing or select a location.",
              "要获得更准确的结果，请启用位置共享或选择位置。"
            )}
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
            onClick={() => navigate("/#calculator")}
          >
            {t("Choose Location", "选择位置")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CurrentLocationReminder;
