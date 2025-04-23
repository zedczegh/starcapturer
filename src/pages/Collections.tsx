import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import { Loader } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { prepareLocationForNavigation } from "@/utils/locationNavigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import PhotoLocationCard from "@/components/photoPoints/PhotoLocationCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sortLocationsBySiqs } from "./collections/sortLocationsBySiqs";
import PageLoader from "@/components/loaders/PageLoader";
import LocationStatusMessage from "@/components/location/LocationStatusMessage";
import MiniRemoveButton from "@/components/collections/MiniRemoveButton";
import AboutFooter from '@/components/about/AboutFooter';
import { useUserCollections } from "@/hooks/collections/useUserCollections";

const Collections = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);

  const [editingNames, setEditingNames] = useState<{[id: string]: string}>({});
  const [savingNames, setSavingNames] = useState<{[id: string]: boolean}>({});

  const {
    locations,
    setLocations,
    loading,
    authChecked,
    error,
    removeLocationImmediately,
    forceReload,
  } = useUserCollections();

  const handleDelete = async (locationId: string) => {
    removeLocationImmediately(locationId);
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
      toast.error(t("Failed to delete location", "删除位置失败"));
    }
  };

  const handleViewDetails = (location: SharedAstroSpot) => {
    const { locationId, locationState } = prepareLocationForNavigation(location);
    if (locationId) {
      navigate(`/location/${locationId}`, { state: locationState });
    }
  };

  const handleNameChange = (id: string, value: string) => {
    setEditingNames((prev) => ({ ...prev, [id]: value }));
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
      
      forceReload?.();
    } catch (error: any) {
      toast.error(t("Failed to update name", "更新名称失败"), { description: error.message });
    } finally {
      setSavingNames((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (!authChecked) return <PageLoader />;

  if (locations === null) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8 pt-16 md:pt-20">
          <LocationStatusMessage
            message={t("Please sign in to view your collections", "请登录以查看您的收藏")}
            type="error"
          />
        </div>
      </div>
    );
  }

  const sortedLocations = sortLocationsBySiqs(locations);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <TooltipProvider>
        <main className="container mx-auto px-4 py-8 pt-16 md:pt-20 flex-grow">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {t("My Collections", "我的收藏")}
            </h1>
            {sortedLocations?.length > 0 && (
              <button
                className="bg-cosmic-800 text-white rounded-full px-4 py-1 text-sm font-medium border border-cosmic-600 shadow hover:bg-cosmic-700 transition"
                onClick={() => setEditMode((v) => !v)}
              >
                {editMode ? t("Done", "完成") : t("Edit", "编辑")}
              </button>
            )}
          </div>

          {error && <LocationStatusMessage message={error} type="error" />}

          {loading && !locations?.length ? (
            <CollectionsLoadingSkeleton />
          ) : locations?.length === 0 ? (
            <div className="text-center py-12 bg-cosmic-800/50 rounded-lg border border-cosmic-700/50">
              <div className="mb-4 text-muted-foreground">
                {t("You haven't saved any locations yet.", "您还没有保存任何位置。")}
              </div>
              <button
                onClick={() => navigate('/photo-points')}
                className="text-primary hover:underline"
              >
                {t("Browse Photo Points", "浏览摄影点")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedLocations.map((location, index) => {
                const isEditing = editMode && editingNames[location.id] !== undefined;
                const customName = isEditing ? editingNames[location.id] : location.name;
                
                return (
                  <div key={location.id} className="relative group">
                    {editMode && (
                      <MiniRemoveButton onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDelete(location.id);
                      }}/>
                    )}
                    {editMode ? (
                      <div className="mb-3 flex items-center gap-2">
                        <Input
                          className="flex-1 px-2 py-1 text-base rounded bg-background border border-cosmic-700 text-foreground"
                          value={editingNames[location.id] ?? location.name}
                          maxLength={32}
                          onChange={(e) =>
                            handleNameChange(location.id, e.target.value)
                          }
                          onClick={(e) => e.stopPropagation()}
                          aria-label={t("Edit location name", "编辑位置名称")}
                          disabled={savingNames[location.id]}
                        />
                        <Button
                          size="sm"
                          className="px-3 py-1 rounded text-xs font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveName(location);
                          }}
                          disabled={savingNames[location.id]}
                          type="button"
                        >
                          {savingNames[location.id]
                            ? t("Saving...", "保存中…")
                            : t("Save", "保存")}
                        </Button>
                      </div>
                    ) : null}
                    <PhotoLocationCard
                      location={{
                        ...location,
                        name: customName
                      }}
                      index={index}
                      onViewDetails={handleViewDetails}
                      showRealTimeSiqs={true}
                      showBortleScale={false}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </TooltipProvider>
      <AboutFooter />
    </div>
  );
};

export default Collections;
