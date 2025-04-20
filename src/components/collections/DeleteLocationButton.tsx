
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DeleteLocationButtonProps {
  locationId: string;
  userId: string;
  onDelete?: (locationId: string) => void;
}

const DeleteLocationButton = ({ locationId, userId, onDelete }: DeleteLocationButtonProps) => {
  const { t } = useLanguage();
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(locationId);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleDelete}
          className="bg-destructive/90 hover:bg-destructive z-20"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {t("Remove from collection", "从收藏中删除")}
      </TooltipContent>
    </Tooltip>
  );
};

export default DeleteLocationButton;
