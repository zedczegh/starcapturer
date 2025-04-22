
import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Image } from "lucide-react";

interface LocationState {
  latitude: number;
  longitude: number;
  name?: string;
}

const LOCATION_TYPES = [
  { name: "National/Academic Observatory", color: "#9b87f5" },
  { name: "Personal Observatory", color: "#0EA5E9" },
  { name: "Personal Favorite Observation Point", color: "#4ADE80" },
  { name: "Favored Observation Point of local hobby groups", color: "#FFD700" },
  { name: "Star Party venue", color: "#FFFF00" },
  { name: "Regular Camping Site", color: "#808000" }
];

const LOCATION_ADVANTAGES = [
  "Low Light Pollution Region",
  "Low Air Pollution Region",
  "Lodging available",
  "Stable and Low Wind Gusts",
  "High Annual Clear Nights Rate(>100 Days a year)",
  "Far enough away from waters",
  "Good Viewing Conditions",
  "Parking available",
  "Well-paved roads to location",
  "No local interruptions",
  "Hard Soil or Concrete floor"
];

const CreateAstroSpot: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [locationName, setLocationName] = useState(state?.name || '');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAdvantages, setSelectedAdvantages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      if (images.length + newImages.length > 10) {
        toast.error(t("Maximum 10 images allowed", "最多允许10张图片"));
        return;
      }
      setImages(prev => [...prev, ...newImages]);
    }
  }, [images.length, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(t("You must be logged in to create an astro spot", "您必须登录才能创建观星点"));
      return;
    }
    
    if (selectedTypes.length === 0) {
      toast.error(t("Please select at least one location type", "请至少选择一个位置类型"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the astro spot
      const { data: spot, error: spotError } = await supabase
        .from('user_astro_spots')
        .insert({
          name: locationName,
          description,
          latitude: state.latitude,
          longitude: state.longitude,
          user_id: user.id
        })
        .select()
        .single();

      if (spotError) throw spotError;

      // Upload images with proper folder structure
      if (images.length > 0) {
        const imagePromises = images.map(async (image, index) => {
          const fileName = `${user.id}/${spot.id}/${Date.now()}_${index}.${image.name.split('.').pop()}`;
          const { error: uploadError } = await supabase.storage
            .from('astro_spot_images')
            .upload(fileName, image);
          
          if (uploadError) throw uploadError;
        });

        await Promise.all(imagePromises);
      }

      // Add types
      if (selectedTypes.length > 0) {
        const { error: typesError } = await supabase
          .from('astro_spot_types')
          .insert(selectedTypes.map(type => ({
            spot_id: spot.id,
            type_name: type
          })));

        if (typesError) throw typesError;
      }

      // Add advantages
      if (selectedAdvantages.length > 0) {
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
          {/* Location Name */}
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

          {/* Location Types */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("Location Types", "位置类型")}
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              {LOCATION_TYPES.map((type) => (
                <label
                  key={type.name}
                  className="flex items-center space-x-2 p-2 rounded border border-border hover:bg-accent/50 transition-colors"
                  style={{ borderLeft: `4px solid ${type.color}` }}
                >
                  <Checkbox
                    checked={selectedTypes.includes(type.name)}
                    onCheckedChange={(checked) => {
                      setSelectedTypes(prev => 
                        checked 
                          ? [...prev, type.name]
                          : prev.filter(t => t !== type.name)
                      );
                    }}
                  />
                  <span>{t(type.name, type.name)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location Advantages */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("Location Advantages", "位置优势")}
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              {LOCATION_ADVANTAGES.map((advantage) => (
                <label
                  key={advantage}
                  className="flex items-center space-x-2 p-2 rounded border border-border hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedAdvantages.includes(advantage)}
                    onCheckedChange={(checked) => {
                      setSelectedAdvantages(prev => 
                        checked 
                          ? [...prev, advantage]
                          : prev.filter(a => a !== advantage)
                      );
                    }}
                  />
                  <span>{t(advantage, advantage)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
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

          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("Location Images", "位置图片")}
              <span className="text-xs text-muted-foreground ml-2">
                ({t("Maximum 10 images", "最多10张图片")})
              </span>
            </label>
            <div className="grid gap-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Image className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t("Click to upload images", "点击上传图片")}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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
