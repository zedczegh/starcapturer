
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoadingTagsProps {
  className?: string;
}

const LoadingTags: React.FC<LoadingTagsProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin text-cosmic-400" />
      <span className="text-sm text-cosmic-400">
        {t('Loading tags...', '加载标签中...')}
      </span>
    </div>
  );
};

export default LoadingTags;
