
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LocationMap from '@/components/location/LocationMap';

interface LocationState {
  latitude: number;
  longitude: number;
  name: string;
  isUserLocation: boolean;
}

const spotTypes = [
  { id: 'national-observatory', name: 'National/Academic Observatory', color: '#9b87f5' },
  { id: 'personal-observatory', name: 'Personal Observatory', color: '#0EA5E9' },
  { id: 'favorite-point', name: 'Personal Favorite Observation Point', color: '#4ADE80' },
  { id: 'hobby-group', name: 'Favored Observation Point of local hobby groups', color: '#FFD700' },
  { id: 'star-party', name: 'Star Party venue', color: '#FFFF00' },
  { id: 'camping', name: 'Regular Camping Site', color: '#808000' },
];

const advantages = [
  { id: 'low-light', label: 'Low Light Pollution Region' },
  { id: 'low-air', label: 'Low Air Pollution Region' },
  { id: 'lodging', label: 'Lodging available' },
  { id: 'low-wind', label: 'Stable and Low Wind Gusts' },
  { id: 'clear-nights', label: 'High Annual Clear Nights Rate(>100 Days a year)' },
  { id: 'far-water', label: 'Far enough away from waters' },
  { id: 'good-view', label: 'Good Viewing Conditions' },
  { id: 'parking', label: 'Parking available' },
  { id: 'paved-roads', label: 'Well-paved roads to location' },
  { id: 'no-interruptions', label: 'No local interruptions' },
  { id: 'hard-soil', label: 'Hard Soil or Concrete floor' },
];

const CreateAstroSpot = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { latitude, longitude, name } = location.state as LocationState;

  const [locationName, setLocationName] = useState(name);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAdvantages, setSelectedAdvantages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t("Please sign in to create an Astro Spot", "请登录以创建天文点"));
      return;
    }

    if (selectedTypes.length === 0) {
      toast.error(t("Please select at least one location type", "请至少选择一个位置类型"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert the main spot record
      const { data: spot, error: spotError } = await supabase
        .from('user_astro_spots')
        .insert({
          name: locationName,
          description,
          latitude,
          longitude,
          user_id: user.id,
        })
        .select()
        .single();

      if (spotError) throw spotError;

      // Insert spot types
      const typePromises = selectedTypes.map(type => 
        supabase
          .from('astro_spot_types')
          .insert({
            spot_id: spot.id,
            type_name: spotTypes.find(t => t.id === type)?.name
          })
      );

      // Insert advantages
      const advantagePromises = selectedAdvantages.map(advantage => 
        supabase
          .from('astro_spot_advantages')
          .insert({
            spot_id: spot.id,
            advantage_name: advantages.find(a => a.id === advantage)?.label
          })
      );

      await Promise.all([...typePromises, ...advantagePromises]);

      toast.success(t("Astro Spot created successfully!", "天文点创建成功！"));
      navigate(`/location/${latitude},${longitude}`);

    } catch (error) {
      console.error('Error creating astro spot:', error);
      toast.error(t("Failed to create Astro Spot", "创建天文点失败"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">{t("Create New Astro Spot", "创建新天文点")}</h1>
          <p className="text-muted-foreground">
            {t("Share your favorite astronomical observation location with the community", 
               "与社区分享您喜爱的天文观测地点")}
          </p>
        </div>

        <div className="h-[300px] rounded-lg overflow-hidden">
          <LocationMap
            latitude={latitude}
            longitude={longitude}
            name={locationName}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Location Name", "位置名称")}
            </label>
            <Input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Location Types", "位置类型")} *
            </label>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-4">
                {spotTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={selectedTypes.includes(type.id)}
                      onCheckedChange={(checked) => {
                        setSelectedTypes(current => 
                          checked 
                            ? [...current, type.id]
                            : current.filter(t => t !== type.id)
                        );
                      }}
                    />
                    <label
                      htmlFor={type.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      style={{ color: type.color }}
                    >
                      {t(type.name, type.name)}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Location Advantages", "位置优势")}
            </label>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-4">
                {advantages.map((advantage) => (
                  <div key={advantage.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={advantage.id}
                      checked={selectedAdvantages.includes(advantage.id)}
                      onCheckedChange={(checked) => {
                        setSelectedAdvantages(current => 
                          checked 
                            ? [...current, advantage.id]
                            : current.filter(a => a !== advantage.id)
                        );
                      }}
                    />
                    <label
                      htmlFor={advantage.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t(advantage.label, advantage.label)}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Description", "描述")}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder={t("Describe your observation location (max 1000 characters)", 
                          "描述您的观测地点（最多1000字）")}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/1000
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("Creating...", "创建中...") : t("Create Astro Spot", "创建天文点")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAstroSpot;
