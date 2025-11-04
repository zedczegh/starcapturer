
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, Trees, Building2, MapPin, Hotel, Globe2 } from 'lucide-react';

export type CertificationType = 'reserve' | 'park' | 'community' | 'urban' | 'lodging' | 'unesco' | 'all';

interface CertificationFilterProps {
  selectedType: CertificationType;
  onTypeChange: (type: CertificationType) => void;
}

const CertificationFilter: React.FC<CertificationFilterProps> = ({
  selectedType,
  onTypeChange
}) => {
  const { t } = useLanguage();
  
  const filterOptions: Array<{
    id: CertificationType;
    label: string;
    icon: React.ElementType;
    color: string;
  }> = [
    {
      id: 'all',
      label: t('All Types', '全部类型'),
      icon: MapPin,
      color: 'text-muted-foreground border-border bg-background/50 hover:bg-background/80'
    },
    {
      id: 'reserve',
      label: t('Dark Sky Reserve', '暗夜保护区'),
      icon: Globe,
      color: 'text-primary border-primary/30 bg-primary/10 hover:bg-primary/20'
    },
    {
      id: 'park',
      label: t('Dark Sky Park', '暗夜公园'),
      icon: Trees,
      color: 'text-primary border-primary/30 bg-primary/10 hover:bg-primary/20'
    },
    {
      id: 'community',
      label: t('Dark Sky Community', '暗夜社区'),
      icon: Building2,
      color: 'text-primary border-primary/30 bg-primary/10 hover:bg-primary/20'
    },
    {
      id: 'urban',
      label: t('Urban Night Sky', '城市夜空'),
      icon: Building2,
      color: 'text-primary border-primary/30 bg-primary/10 hover:bg-primary/20'
    },
    {
      id: 'lodging',
      label: t('Dark Sky Lodging', '暗夜住宿'),
      icon: Hotel,
      color: 'text-primary border-primary/30 bg-primary/10 hover:bg-primary/20'
    },
    {
      id: 'unesco',
      label: t('UNESCO Dark Sky', '联合国教科文组织暗夜'),
      icon: Globe2,
      color: 'text-primary border-primary/30 bg-primary/10 hover:bg-primary/20'
    }
  ];

  return (
    <div className="mb-4 px-2">
      <div className="text-sm text-muted-foreground mb-2">
        {t('Filter by certification type', '按认证类型筛选')}:
      </div>
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Badge
            key={option.id}
            variant="outline"
            className={`
              ${option.color}
              px-2.5 py-1.5 
              rounded-full 
              flex items-center
              cursor-pointer
              transition-all
              ${selectedType === option.id ? 'ring-2 ring-primary ring-offset-1' : ''}
            `}
            onClick={() => onTypeChange(option.id)}
          >
            <option.icon className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-sm">{option.label}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default CertificationFilter;
