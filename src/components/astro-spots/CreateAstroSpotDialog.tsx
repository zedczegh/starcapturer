
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus } from "lucide-react";
import LocationTypeSelector from './LocationTypeSelector';
import LocationAdvantagesSelector from './LocationAdvantagesSelector';
import ImageUploader from './ImageUploader';
import { useCreateAstroSpot } from '@/hooks/useCreateAstroSpot';
import SpotTypeSelector, { SpotType } from './SpotTypeSelector';

interface CreateAstroSpotDialogProps {
  latitude: number;
  longitude: number;
  defaultName?: string;
  isEditing?: boolean;
  spotId?: string;
  defaultDescription?: string;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

const CreateAstroSpotDialog: React.FC<CreateAstroSpotDialogProps> = ({
  latitude,
  longitude,
  defaultName,
  isEditing = false,
  spotId,
  defaultDescription = '',
  trigger,
  onClose
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [spotType, setSpotType] = useState<SpotType>('nightscape');
  
  const {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit,
    isSuccess
  } = useCreateAstroSpot(latitude, longitude, defaultName, isEditing, spotId, defaultDescription);

  const handleDialogClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Automatically close the dialog when submission is successful
  React.useEffect(() => {
    if (isSuccess) {
      handleDialogClose();
    }
  }, [isSuccess]);

  const defaultTrigger = (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      {t("Create New Spot", "创建新地点")}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) handleDialogClose();
    }}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5 text-primary" />
            {isEditing 
              ? t("Edit Spot", "编辑地点")
              : t("Create New Spot", "创建新地点")
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("Spot Type", "地点类型")} *
            </label>
            <SpotTypeSelector value={spotType} onChange={setSpotType} />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("Location Name", "位置名称")} *
            </label>
            <Input
              value={formData.locationName}
              onChange={(e) => setFormData(prev => ({ ...prev, locationName: e.target.value }))}
              placeholder={t("Enter location name", "输入位置名称")}
              required
            />
          </div>

          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("Latitude", "纬度")}
                </label>
                <Input value={latitude} readOnly />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("Longitude", "经度")}
                </label>
                <Input value={longitude} readOnly />
              </div>
            </div>
          </div>

          <LocationTypeSelector 
            selectedTypes={formData.selectedTypes}
            onTypesChange={(types) => setFormData(prev => ({ ...prev, selectedTypes: types }))}
          />

          <LocationAdvantagesSelector
            selectedAdvantages={formData.selectedAdvantages}
            onAdvantagesChange={(advantages) => setFormData(prev => ({ ...prev, selectedAdvantages: advantages }))}
          />

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("Description", "描述")}
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t("Describe this location (max 1000 characters)", "描述这个位置（最多1000字符）")}
              maxLength={1000}
              className="min-h-[100px] resize-none"
            />
          </div>

          {!isEditing && (
            <ImageUploader
              images={formData.images}
              onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
            />
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={handleDialogClose}>
              {t("Cancel", "取消")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (isEditing ? t("Updating...", "更新中...") : t("Creating...", "创建中..."))
                : (isEditing ? t("Update Information", "更新信息") : t("Create Spot", "创建地点"))
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAstroSpotDialog;
