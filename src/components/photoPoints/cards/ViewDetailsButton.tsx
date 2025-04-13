
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ViewDetailsButtonProps {
  onClick: () => void;
}

const ViewDetailsButton: React.FC<ViewDetailsButtonProps> = ({ onClick }) => {
  const { t } = useLanguage();
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="text-primary hover:text-primary-focus hover:bg-cosmic-800/50 sci-fi-btn transition-all duration-300 text-sm"
    >
      {t("View Details", "查看详情")}
    </Button>
  );
};

export default ViewDetailsButton;
