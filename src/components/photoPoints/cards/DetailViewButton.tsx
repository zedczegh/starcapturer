
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface DetailViewButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

const DetailViewButton: React.FC<DetailViewButtonProps> = ({ onClick }) => {
  const { t } = useLanguage();
  
  return (
    <Button
      variant="ghost"
      size="sm"
      className="px-2 py-0 h-7 text-xs text-primary"
      onClick={onClick}
    >
      {t("View Details", "查看详情")}
      <ChevronRight className="ml-1 h-3 w-3" />
    </Button>
  );
};

export default DetailViewButton;
