
import React from 'react';
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
  const {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit,
  } = useCreateAstroSpot(latitude, longitude, defaultName, isEditing, spotId, defaultDescription);

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const defaultTrigger = (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      {t("Create New Astro Spot", "创建新的观星点")}
    </Button>
  );

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5 text-primary" />
            {isEditing 
              ? t("Edit Astro Spot", "编辑观星点")
              : t("Create New Astro Spot", "创建新的观星点")
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
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

          <ImageUploader
            images={formData.images}
            onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
          />

          <div className="flex justify-end gap-4 pt-4">
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                {t("Cancel", "取消")}
              </Button>
            </DialogTrigger>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("Creating...", "创建中...") : t("Create Astro Spot", "创建观星点")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAstroSpotDialog;
