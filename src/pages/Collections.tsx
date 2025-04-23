
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { prepareLocationForNavigation } from "@/utils/locationNavigation";
import { sortLocationsBySiqs } from "./collections/sortLocationsBySiqs";
import PageLoader from "@/components/loaders/PageLoader";
import LocationStatusMessage from "@/components/location/LocationStatusMessage";
import AboutFooter from '@/components/about/AboutFooter';
import { useUserCollections } from "@/hooks/collections/useUserCollections";
import CollectionsLoadingSkeleton from "@/components/collections/CollectionsLoadingSkeleton";
import CollectionHeader from "@/components/collections/CollectionHeader";
import CollectionGrid from "@/components/collections/CollectionGrid";
import EmptyCollections from "@/components/collections/EmptyCollections";
import { useCollectionActions } from "@/hooks/collections/useCollectionActions";

const Collections = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);

  const {
    locations,
    setLocations,
    loading,
    authChecked,
    error,
    forceReload,
  } = useUserCollections();

  const {
    editingNames,
    savingNames,
    handleNameChange,
    handleDelete,
    handleSaveName,
  } = useCollectionActions(locations, setLocations, forceReload);

  const handleViewDetails = (location: any) => {
    const { locationId, locationState } = prepareLocationForNavigation(location);
    if (locationId) {
      navigate(`/location/${locationId}`, { state: locationState });
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
          <CollectionHeader 
            count={sortedLocations?.length || 0}
            editMode={editMode}
            onToggleEditMode={() => setEditMode(prev => !prev)}
          />

          {error && <LocationStatusMessage message={error} type="error" />}

          {loading && !locations?.length ? (
            <CollectionsLoadingSkeleton />
          ) : locations?.length === 0 ? (
            <EmptyCollections />
          ) : (
            <CollectionGrid
              locations={sortedLocations}
              editMode={editMode}
              editingNames={editingNames}
              savingNames={savingNames}
              onNameChange={handleNameChange}
              onSaveName={handleSaveName}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
            />
          )}
        </main>
      </TooltipProvider>
      <AboutFooter />
    </div>
  );
};

export default Collections;
