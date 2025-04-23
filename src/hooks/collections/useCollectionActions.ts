
import { useState } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

export const useCollectionActions = (
  locations: SharedAstroSpot[], 
  setLocations: React.Dispatch<React.SetStateAction<SharedAstroSpot[]>>,
  forceReload?: () => void
) => {
  const { t } = useLanguage();
  const [editingNames, setEditingNames] = useState<{[id: string]: string}>({});
  const [savingNames, setSavingNames] = useState<{[id: string]: boolean}>({});

  const handleNameChange = (id: string, value: string) => {
    setEditingNames((prev) => ({ ...prev, [id]: value }));
  };

  const handleDelete = async (locationId: string) => {
    // Remove from UI immediately for perceived performance
    const updatedLocations = locations.filter(loc => loc.id !== locationId);
    setLocations(updatedLocations);
    
    try {
      const { error: dbError } = await import("@/integrations/supabase/client")
        .then((mod) => mod.supabase)
        .then((supabase) =>
          supabase
            .from("saved_locations")
            .delete()
            .eq("id", locationId)
        );
      if (dbError) throw dbError;
      toast.success(t("Location removed from collection", "位置已从收藏中删除"));
    } catch (err) {
      // Restore the removed location if delete fails
      setLocations(locations);
      toast.error(t("Failed to delete location", "删除位置失败"));
    }
  };

  const handleSaveName = async (location: SharedAstroSpot) => {
    const id = location.id;
    const newName = (editingNames[id] ?? "").trim();
    if (!newName) {
      toast.error(t("Name cannot be empty", "名称不能为空"));
      return;
    }
    if (newName === location.name) {
      toast.info(t("No changes to save", "没有更改需要保存"));
      return;
    }

    setSavingNames((prev) => ({ ...prev, [id]: true }));
    try {
      const supabase = (await import("@/integrations/supabase/client")).supabase;
      const { error } = await supabase
        .from("saved_locations")
        .update({ name: newName })
        .eq("id", id);

      if (error) throw error;

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === id ? { ...loc, name: newName } : loc
        )
      );
      toast.success(t("Location name updated", "位置名称已更新"));
      
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
