
import React from 'react';
import { Button } from '../../ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export type CertificationType = 'all' | 'reserve' | 'park' | 'community' | 'urban' | 'lodging';

interface CertificationFilterProps {
  selectedType: CertificationType;
  onTypeChange: (type: CertificationType) => void;
  className?: string;
}

const CertificationFilter: React.FC<CertificationFilterProps> = ({ 
  selectedType, 
  onTypeChange,
  className = ''
}) => {
  const { t } = useLanguage();

  const certificationTypes: { 
    value: CertificationType; 
    label: { en: string; zh: string }; 
    count?: number;
  }[] = [
    { value: 'all', label: { en: 'All', zh: '全部' } },
    { value: 'reserve', label: { en: 'Reserves', zh: '保护区' } },
    { value: 'park', label: { en: 'Parks', zh: '公园' } },
    { value: 'community', label: { en: 'Communities', zh: '社区' } },
    { value: 'urban', label: { en: 'Urban Places', zh: '城市地区' } },
    { value: 'lodging', label: { en: 'Lodging', zh: '住宿' } },
  ];

  return (
    <div className={`flex flex-wrap justify-center gap-2 ${className}`}>
      {certificationTypes.map(type => (
        <Button
          key={type.value}
          size="sm"
          variant={selectedType === type.value ? "default" : "outline"}
          onClick={() => onTypeChange(type.value)}
          className="min-w-[80px]"
        >
          {t(type.label.en, type.label.zh)}
          {type.count !== undefined && ` (${type.count})`}
        </Button>
      ))}
    </div>
  );
};

export default React.memo(CertificationFilter);
