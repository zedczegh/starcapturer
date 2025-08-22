import { useState } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface SavedAstroSpot {
  id: string;
  spot_id: string;
  name: string;
  latitude: number;
  longitude: number;
  bortlescale?: number;
  siqs?: number;
  verification_status?: string;
  created_at: string;
  updated_at: string;
}

export const useAstroSpotCollectionActions = (
  spots: SavedAstroSpot[], 
  setSpots: React.Dispatch<React.SetStateAction<SavedAstroSpot[]>>,
  forceReload?: () => void
) => {
  const { t } = useLanguage();
  const [editingNames, setEditingNames] = useState<{[id: string]: string}>({});
  const [savingNames, setSavingNames] = useState<{[id: string]: boolean}>({});

  const handleNameChange = (id: string, value: string) => {
    setEditingNames((prev) => ({ ...prev, [id]: value }));
  };

  const handleDelete = async (spotId: string) => {
    // Remove from UI immediately for perceived performance
    const updatedSpots = spots.filter(spot => spot.spot_id !== spotId);
    setSpots(updatedSpots);
    
    try {
      const { error: dbError } = await import("@/integrations/supabase/client")
        .then((mod) => mod.supabase)
        .then((supabase) =>
          supabase
            .from("saved_astro_spots")
            .delete()
            .eq("spot_id", spotId)
        );
      if (dbError) throw dbError;
      toast.success(t("AstroSpot removed from collection", "观星点已从收藏中删除"));
    } catch (err) {
      // Restore the removed spot if delete fails
      setSpots(spots);
      toast.error(t("Failed to delete astro spot", "删除观星点失败"));
    }
  };

  const handleSaveName = async (spot: SavedAstroSpot) => {
    const id = spot.id;
    const newName = (editingNames[id] ?? "").trim();
    if (!newName) {
      toast.error(t("Name cannot be empty", "名称不能为空"));
      return;
    }
    if (newName === spot.name) {
      toast.info(t("No changes to save", "没有更改需要保存"));
      return;
    }

    setSavingNames((prev) => ({ ...prev, [id]: true }));
    try {
      const supabase = (await import("@/integrations/supabase/client")).supabase;
      const { error } = await supabase
        .from("saved_astro_spots")
        .update({ name: newName })
        .eq("id", id);

      if (error) throw error;

      setSpots((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, name: newName } : s
        )
      );
      toast.success(t("AstroSpot name updated", "观星点名称已更新"));
      
      setEditingNames((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      
      if (forceReload) {
        forceReload();
      }
    } catch (error: any) {
      toast.error(t("Failed to update name", "更新名称失败"), { description: error.message });
    } finally {
      setSavingNames((prev) => ({ ...prev, [id]: false }));
    }
  };

  return {
    editingNames,
    savingNames,
    handleNameChange,
    handleDelete,
    handleSaveName,
  };
};