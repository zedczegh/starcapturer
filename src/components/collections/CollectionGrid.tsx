
import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import PhotoLocationCard from "@/components/photoPoints/PhotoLocationCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MiniRemoveButton from "@/components/collections/MiniRemoveButton";

interface CollectionGridProps {
  locations: SharedAstroSpot[];
  editMode: boolean;
  editingNames: { [id: string]: string };
  savingNames: { [id: string]: boolean };
  onNameChange: (id: string, value: string) => void;
  onSaveName: (location: SharedAstroSpot) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewDetails: (location: SharedAstroSpot) => void;
}

const CollectionGrid: React.FC<CollectionGridProps> = ({
  locations,
  editMode,
  editingNames,
  savingNames,
  onNameChange,
  onSaveName,
  onDelete,
  onViewDetails,
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {locations.map((location, index) => {
        const isEditing = editMode && editingNames[location.id] !== undefined;
        const customName = isEditing ? editingNames[location.id] : location.name;
        
        return (
          <div key={location.id} className="relative group">
            {editMode && (
              <MiniRemoveButton onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete(location.id);
              }}/>
            )}
            {editMode ? (
              <div className="mb-3 flex items-center gap-2">
                <Input
                  className="flex-1 px-2 py-1 text-base rounded bg-background border border-cosmic-700 text-foreground"
                  value={editingNames[location.id] ?? location.name}
                  maxLength={32}
                  onChange={(e) =>
                    onNameChange(location.id, e.target.value)
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
                    onSaveName(location);
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
              onViewDetails={onViewDetails}
              showRealTimeSiqs={true}
              showBortleScale={false}
            />
          </div>
        );
      })}
    </div>
  );
};

export default CollectionGrid;
