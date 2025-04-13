
import React from 'react';
import { Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CertificationDisplayProps {
  isCertified: boolean;
  compact?: boolean;
}

const CertificationDisplay: React.FC<CertificationDisplayProps> = ({ 
  isCertified, 
  compact = false 
}) => {
  const { t } = useLanguage();
  
  if (!isCertified) return null;
  
  return (
    <div className="flex items-center gap-1 mt-1">
      <Award className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-500`} />
      <span className={`${compact ? 'text-2xs' : 'text-xs'} text-amber-300`}>
        {t("Certified Dark Sky", "官方认证暗夜天空")}
      </span>
    </div>
  );
};

export default CertificationDisplay;
