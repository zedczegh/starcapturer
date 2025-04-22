import React from 'react';
import { useForm } from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const locationTypes = [
  { id: "national-observatory", label: "National/Academic Observatory" },
  { id: "personal-observatory", label: "Personal Observatory" },
  { id: "favorite-point", label: "Personal Favorite Observation Point" },
  { id: "hobby-group", label: "Favored Observation Point of local hobby groups" },
  { id: "star-party", label: "Star Party venue" },
  { id: "camping", label: "Regular Camping Site" }
];

const advantages = [
  { id: "low-light", label: "Low Light Pollution Region" },
  { id: "low-air", label: "Low Air Pollution Region" },
  { id: "lodging", label: "Lodging available" },
  { id: "low-wind", label: "Stable and Low Wind Gusts" },
  { id: "clear-nights", label: "High Annual Clear Nights Rate (>100 Days a year)" },
  { id: "far-water", label: "Far enough away from waters" },
  { id: "good-view", label: "Good Viewing Conditions" },
  { id: "parking", label: "Parking available" },
  { id: "paved-roads", label: "Well-paved roads to location" },
  { id: "no-interruptions", label: "No local interruptions" },
  { id: "hard-floor", label: "Hard Soil or Concrete floor" }
];

interface CreateAstroSpotFormProps {
  latitude: number;
  longitude: number;
  locationName?: string;
}

interface FormValues {
  name: string;
  types: string[];
  advantages: string[];
  description: string;
}

const CreateAstroSpotForm: React.FC<CreateAstroSpotFormProps> = ({
  latitude,
  longitude,
  locationName = ""
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const form = useForm<FormValues>({
    defaultValues: {
      name: locationName,
      types: [],
      advantages: [],
      description: ""
    }
  });

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error(t("Please sign in to create an Astro Spot", "请登录以创建观星点"));
      return;
    }

    if (data.types.length === 0) {
      toast.error(t("Please select at least one location type", "请至少选择一个位置类型"));
      return;
    }

    try {
      const { data: spotData, error: spotError } = await supabase
        .from('user_astro_spots')
        .insert({
          name: data.name,
          description: data.description,
          latitude: latitude,
          longitude: longitude,
          user_id: user.id,
        })
        .select('id')
        .single();

      if (spotError) throw spotError;

      const typesInsert = data.types.map(type => ({
        spot_id: spotData.id,
        type_name: type
      }));
      const { error: typesError } = await supabase
        .from('astro_spot_types')
        .insert(typesInsert);

      if (typesError) throw typesError;

      const advantagesInsert = data.advantages.map(advantage => ({
        spot_id: spotData.id,
        advantage_name: advantage
      }));
      const { error: advantagesError } = await supabase
        .from('astro_spot_advantages')
        .insert(advantagesInsert);

      if (advantagesError) throw advantagesError;

      toast.success(t("Astro Spot created successfully!", "观星点创建成功！"));
      navigate('/photo-points');
    } catch (error) {
      console.error('Error creating astro spot:', error);
      toast.error(t("Failed to create Astro Spot", "创建观星点失败"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Location Name", "位置名称")}</FormLabel>
              <FormControl>
                <Input placeholder={t("Enter location name", "输入位置名称")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>{t("Location Types", "位置类型")} *</FormLabel>
          <div className="grid gap-4 pt-2">
            {locationTypes.map((type) => (
              <FormField
                key={type.id}
                control={form.control}
                name="types"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(type.id)}
                        onCheckedChange={(checked) => {
                          const currentValue = field.value || [];
                          if (checked) {
                            field.onChange([...currentValue, type.id]);
                          } else {
                            field.onChange(currentValue.filter((value) => value !== type.id));
                          }
                        }}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      {t(type.label, type.label)}
                    </FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <FormLabel>{t("Location Advantages", "位置优势")}</FormLabel>
          <div className="grid gap-4 pt-2">
            {advantages.map((advantage) => (
              <FormField
                key={advantage.id}
                control={form.control}
                name="advantages"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(advantage.id)}
                        onCheckedChange={(checked) => {
                          const currentValue = field.value || [];
                          if (checked) {
                            field.onChange([...currentValue, advantage.id]);
                          } else {
                            field.onChange(currentValue.filter((value) => value !== advantage.id));
                          }
                        }}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      {t(advantage.label, advantage.label)}
                    </FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Location Description", "位置描述")}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t("Describe this location (max 1000 characters)", "描述此位置（最多1000字）")}
                  className="min-h-[100px]"
                  maxLength={1000}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t("Maximum 1000 characters", "最多1000字")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button type="submit">
            {t("Create Astro Spot", "创建观星点")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateAstroSpotForm;
