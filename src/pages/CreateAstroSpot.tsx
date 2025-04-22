
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from "@/contexts/LanguageContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import LocationTypeSelector from '@/components/astro-spots/LocationTypeSelector';
import LocationAdvantagesSelector from '@/components/astro-spots/LocationAdvantagesSelector';
import ImageUploader from '@/components/astro-spots/ImageUploader';
import { useCreateAstroSpot } from '@/hooks/useCreateAstroSpot';

interface LocationState {
  latitude: number;
  longitude: number;
  name?: string;
}

const CreateAstroSpot: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit,
  } = useCreateAstroSpot(state.latitude, state.longitude, state.name);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            {t("Create New Astro Spot", "创建新的观星点")}
          </h1>
          <p className="text-muted-foreground">
            {t("Fill in the details below to create your astro spot.", "填写以下详情来创建您的观星点。")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("Location Name", "位置名称")}
            </label>
            <Input
              value={formData.locationName}
              onChange={(e) => setFormData(prev => ({ ...prev, locationName: e.target.value }))}
              placeholder={t("Enter location name", "输入位置名称")}
              required
            />
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
              className="min-h-[100px]"
            />
          </div>

          <ImageUploader
            images={formData.images}
            onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
          />

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => history.back()}
              disabled={isSubmitting}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("Creating...", "创建中...") : t("Create Astro Spot", "创建观星点")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAstroSpot;
