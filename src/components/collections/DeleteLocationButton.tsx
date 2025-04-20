
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeleteLocationButtonProps {
  locationId: string;
  userId: string;
}

const DeleteLocationButton = ({ locationId, userId }: DeleteLocationButtonProps) => {
  const { t } = useLanguage();
  
  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', locationId)
        .eq('user_id', userId);

      if (error) throw error;
      toast.success(t("Location removed from collection", "位置已从收藏中删除"));
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error(t("Failed to delete location", "删除位置失败"));
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleDelete}
      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
};

export default DeleteLocationButton;
