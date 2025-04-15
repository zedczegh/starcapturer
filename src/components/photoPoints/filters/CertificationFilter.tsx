
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, Trees, Building2, Hotel, X } from 'lucide-react';

export type CertificationType = 'reserve' | 'park' | 'community' | 'urban' | 'lodging' | 'all';

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
      icon: X,
      color: 'text-gray-400 border-gray-400/30 bg-gray-400/10 hover:bg-gray-400/20'
    },
    {
      id: 'reserve',
      label: t('Dark Sky Reserve', '暗夜保护区'),
      icon: Globe,
      color: 'text-blue-400 border-blue-400/30 bg-blue-400/10 hover:bg-blue-400/20'
    },
    {
      id: 'park',
      label: t('Dark Sky Park', '暗夜公园'),
      icon: Trees,
      color: 'text-green-400 border-green-400/30 bg-green-400/10 hover:bg-green-400/20'
    },
    {
      id: 'community',
      label: t('Dark Sky Community', '暗夜社区'),
      icon: Building2,
      color: 'text-amber-400 border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20'
    },
    {
      id: 'urban',
      label: t('Urban Night Sky', '城市夜空'),
      icon: Building2,
      color: 'text-purple-400 border-purple-400/30 bg-purple-400/10 hover:bg-purple-400/20'
    },
    {
      id: 'lodging',
      label: t('Dark Sky Lodging', '暗夜住宿'),
      icon: Hotel,
      color: 'text-blue-900 border-blue-900/30 bg-blue-900/10 hover:bg-blue-900/20'
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
