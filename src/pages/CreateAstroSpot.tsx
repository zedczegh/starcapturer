
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";
import LocationTypeSelector from '@/components/astro-spots/LocationTypeSelector';
import LocationAdvantagesSelector from '@/components/astro-spots/LocationAdvantagesSelector';
import ImageUploader from '@/components/astro-spots/ImageUploader';

interface LocationState {
  latitude: number;
  longitude: number;
  name?: string;
}

const CreateAstroSpot: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { role, isAdmin } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [locationName, setLocationName] = useState(state?.name || '');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAdvantages, setSelectedAdvantages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(t("You must be logged in to create an astro spot", "您必须登录才能创建观星点"));
      return;
    }
    
    if (!isAdmin && selectedTypes.length === 0) {
      toast.error(t("Please select at least one location type", "请至少选择一个位置类型"));
      return;
    }

    setIsSubmitting(true);
    try {
      const userIdToUse = isAdmin ? user.id : user.id;

      const { data: spot, error: spotError } = await supabase
        .from('user_astro_spots')
        .insert({
          name: locationName,
          description,
          latitude: state.latitude,
          longitude: state.longitude,
          user_id: userIdToUse
        })
        .select()
        .single();

      if (spotError) throw spotError;

      if (images.length > 0) {
        const imagePromises = images.map(async (image, index) => {
          const fileName = `${userIdToUse}/${spot.id}/${Date.now()}_${index}.${image.name.split('.').pop()}`;
          const { error: uploadError } = await supabase.storage
            .from('astro_spot_images')
            .upload(fileName, image);
          
          if (uploadError) throw uploadError;
        });

        await Promise.all(imagePromises);
      }

      if (isAdmin || selectedTypes.length > 0) {
        const { error: typesError } = await supabase
          .from('astro_spot_types')
          .insert(selectedTypes.map(type => ({
            spot_id: spot.id,
            type_name: type
          })));

        if (typesError) throw typesError;
      }

      if (isAdmin || selectedAdvantages.length > 0) {
        const { error: advantagesError } = await supabase
          .from('astro_spot_advantages')
          .insert(selectedAdvantages.map(advantage => ({
            spot_id: spot.id,
            advantage_name: advantage
          })));

        if (advantagesError) throw advantagesError;
      }

      toast.success(t("Astro spot created successfully!", "观星点创建成功！"));
      navigate(`/location/${state.latitude.toFixed(6)},${state.longitude.toFixed(6)}`);

    } catch (error) {
      console.error('Error creating astro spot:', error);
      toast.error(t("Error creating astro spot", "创建观星点时出错"));
    } finally {
      setIsSubmitting(false);
    }
  };

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
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder={t("Enter location name", "输入位置名称")}
              required
            />
          </div>

          <LocationTypeSelector 
            selectedTypes={selectedTypes}
            onTypesChange={setSelectedTypes}
          />

          <LocationAdvantagesSelector
            selectedAdvantages={selectedAdvantages}
            onAdvantagesChange={setSelectedAdvantages}
          />

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("Description", "描述")}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("Describe this location (max 1000 characters)", "描述这个位置（最多1000字符）")}
              maxLength={1000}
              className="min-h-[100px]"
            />
          </div>

          <ImageUploader
            images={images}
            onImagesChange={setImages}
          />

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
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
