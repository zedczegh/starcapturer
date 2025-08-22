
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prepareLocationForNavigation } from "@/utils/locationNavigation";
import { sortLocationsBySiqs } from "./collections/sortLocationsBySiqs";
import PageLoader from "@/components/loaders/PageLoader";
import LocationStatusMessage from "@/components/location/LocationStatusMessage";
import AboutFooter from '@/components/about/AboutFooter';
import { useUserCollections } from "@/hooks/collections/useUserCollections";
import { useUserAstroSpotCollections } from "@/hooks/collections/useUserAstroSpotCollections";
import CollectionsLoadingSkeleton from "@/components/collections/CollectionsLoadingSkeleton";
import CollectionHeader from "@/components/collections/CollectionHeader";
import CollectionGrid from "@/components/collections/CollectionGrid";
import AstroSpotCollectionGrid from "@/components/collections/AstroSpotCollectionGrid";
import EmptyCollections from "@/components/collections/EmptyCollections";
import { useCollectionActions } from "@/hooks/collections/useCollectionActions";
import { useAstroSpotCollectionActions } from "@/hooks/collections/useAstroSpotCollectionActions";

const Collections = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);

  // Location collections
  const {
    locations,
    setLocations,
    loading: locationsLoading,
    authChecked: locationsAuthChecked,
    error: locationsError,
    forceReload: reloadLocations,
  } = useUserCollections();

  // AstroSpot collections
  const {
    spots,
    setSpots,
    loading: spotsLoading,
    authChecked: spotsAuthChecked,
    error: spotsError,
    forceReload: reloadSpots,
  } = useUserAstroSpotCollections();

  // Location collection actions
  const {
    editingNames: editingLocationNames,
    savingNames: savingLocationNames,
    handleNameChange: handleLocationNameChange,
    handleDelete: handleLocationDelete,
    handleSaveName: handleLocationSaveName,
  } = useCollectionActions(locations, setLocations, reloadLocations);

  // AstroSpot collection actions
  const {
    editingNames: editingSpotNames,
    savingNames: savingSpotNames,
    handleNameChange: handleSpotNameChange,
    handleDelete: handleSpotDelete,
    handleSaveName: handleSpotSaveName,
  } = useAstroSpotCollectionActions(spots, setSpots, reloadSpots);

  const handleViewLocationDetails = (location: any) => {
    const { locationId, locationState } = prepareLocationForNavigation(location);
    if (locationId) {
      navigate(`/location/${locationId}`, { state: locationState });
    }
  };

  const handleViewSpotDetails = (spot: any) => {
    navigate(`/astro-spot/${spot.spot_id}`);
  };

  const authChecked = locationsAuthChecked && spotsAuthChecked;
  const loading = locationsLoading || spotsLoading;
  const hasError = locationsError || spotsError;

  if (!authChecked) return <PageLoader />;

  if (locations === null && spots === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
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

  const sortedLocations = sortLocationsBySiqs(locations || []);
  const totalItems = (locations?.length || 0) + (spots?.length || 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
      <NavBar />
      <TooltipProvider>
        <main className="container mx-auto px-4 py-8 pt-16 md:pt-20 flex-grow">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                {t("My Collections", "我的收藏")}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-cosmic-300">
                  {t("Total Items", "总数")}: <span className="text-primary font-medium">{totalItems}</span>
                </span>
                <Button
                  onClick={() => setEditMode(prev => !prev)}
                  variant="outline"
                  size="sm"
                  className="bg-cosmic-800/30 border-cosmic-700/50 hover:bg-cosmic-700/50"
                >
                  {editMode ? t("Done", "完成") : t("Edit", "编辑")}
                </Button>
              </div>
            </div>
            <p className="text-cosmic-400">
              {t("Manage your saved locations and astro spots", "管理您保存的位置和观星点")}
            </p>
          </div>

          {hasError && (
            <LocationStatusMessage 
              message={locationsError || spotsError || ""} 
              type="error" 
            />
          )}

          <Tabs defaultValue="locations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-cosmic-800/30 border border-cosmic-700/50">
              <TabsTrigger 
                value="locations" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t("Photo Locations", "摄影位置")} ({locations?.length || 0})
              </TabsTrigger>
              <TabsTrigger 
                value="astrospots"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t("AstroSpots", "观星点")} ({spots?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="locations" className="space-y-4">
              {loading && !locations?.length ? (
                <CollectionsLoadingSkeleton />
              ) : locations?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-cosmic-400 mb-4">
                    {t("No photo locations saved yet", "尚未保存任何摄影位置")}
                  </div>
                  <Button 
                    onClick={() => navigate('/explore')}
                    variant="outline"
                    className="bg-cosmic-800/30 border-cosmic-700/50 hover:bg-cosmic-700/50"
                  >
                    {t("Explore Locations", "探索位置")}
                  </Button>
                </div>
              ) : (
                <CollectionGrid
                  locations={sortedLocations}
                  editMode={editMode}
                  editingNames={editingLocationNames}
                  savingNames={savingLocationNames}
                  onNameChange={handleLocationNameChange}
                  onSaveName={handleLocationSaveName}
                  onDelete={handleLocationDelete}
                  onViewDetails={handleViewLocationDetails}
                />
              )}
            </TabsContent>

            <TabsContent value="astrospots" className="space-y-4">
              {loading && !spots?.length ? (
                <CollectionsLoadingSkeleton />
              ) : spots?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-cosmic-400 mb-4">
                    {t("No astro spots saved yet", "尚未保存任何观星点")}
                  </div>
                  <Button 
                    onClick={() => navigate('/community')}
                    variant="outline"
                    className="bg-cosmic-800/30 border-cosmic-700/50 hover:bg-cosmic-700/50"
                  >
                    {t("Browse Community", "浏览社区")}
                  </Button>
                </div>
              ) : (
                <AstroSpotCollectionGrid
                  spots={spots}
                  editMode={editMode}
                  editingNames={editingSpotNames}
                  savingNames={savingSpotNames}
                  onNameChange={handleSpotNameChange}
                  onSaveName={handleSpotSaveName}
                  onDelete={handleSpotDelete}
                  onViewDetails={handleViewSpotDetails}
                />
              )}
            </TabsContent>
          </Tabs>
        </main>
      </TooltipProvider>
      <AboutFooter />
    </div>
  );
};

export default Collections;
