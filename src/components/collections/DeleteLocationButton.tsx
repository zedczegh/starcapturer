
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
    // Ensure event doesn't bubble up and prevent default behavior
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', locationId)
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success(t("Location removed from collection", "位置已从收藏中删除"));
      
      // Call the onDelete callback to update the UI immediately
      if (onDelete) {
        onDelete(locationId);
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error(t("Failed to delete location", "删除位置失败"));
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleDelete}
          className="bg-destructive/90 hover:bg-destructive"
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
