
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface CardActionsProps {
  onViewDetails: (e: React.MouseEvent) => void;
}

const CardActions: React.FC<CardActionsProps> = ({ onViewDetails }) => {
  const { t } = useLanguage();
  
  return (
    <div className="mt-4 flex justify-end">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling
          e.preventDefault(); // Prevent default behavior
          onViewDetails(e);
        }}
        className="text-primary hover:text-primary-focus hover:bg-cosmic-800/50 sci-fi-btn transition-all duration-300 text-sm z-20"
      >
        {t("View Details", "查看详情")}
      </Button>
    </div>
  );
};

export default CardActions;
