
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import AboutFooter from '@/components/about/AboutFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SPOT_TYPES = [
  { id: 'national-observatory', name: 'National/Academic Observatory', color: '#9b87f5' },
  { id: 'personal-observatory', name: 'Personal Observatory', color: '#0EA5E9' },
  { id: 'favorite-point', name: 'Personal Favorite Observation Point', color: '#4ADE80' },
  { id: 'hobby-group', name: 'Favored Observation Point of local hobby groups', color: '#FFD700' },
  { id: 'star-party', name: 'Star Party venue', color: '#FFFF00' },
  { id: 'camping', name: 'Regular Camping Site', color: '#808000' }
];

const ADVANTAGES = [
  'Low Light Pollution Region',
  'Low Air Pollution Region',
  'Lodging available',
  'Stable and Low Wind Gusts',
  'High Annual Clear Nights Rate(>100 Days a year)',
  'Far enough away from waters',
  'Good Viewing Conditions',
  'Parking available',
  'Well-paved roads to location',
  'No local interruptions',
  'Hard Soil or Concrete floor'
];

const CreateAstroSpot = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [name, setName] = useState(state?.name || '');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAdvantages, setSelectedAdvantages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (selectedTypes.length === 0) {
      toast.error(t("Please select at least one location type", "请至少选择一个位置类型"));
      return;
    }

    setSaving(true);
    try {
      // Insert the spot
      const { data: spot, error: spotError } = await supabase
        .from('user_astro_spots')
        .insert({
          name,
          description,
          user_id: user.id,
          latitude: state.latitude,
          longitude: state.longitude,
        })
        .select()
        .single();

      if (spotError) throw spotError;

      // Insert spot types
      const spotTypes = selectedTypes.map(type => ({
        spot_id: spot.id,
        type_name: type
      }));

      const { error: typesError } = await supabase
        .from('astro_spot_types')
        .insert(spotTypes);

      if (typesError) throw typesError;

      // Insert advantages
      const advantages = selectedAdvantages.map(advantage => ({
        spot_id: spot.id,
        advantage_name: advantage
      }));

      const { error: advantagesError } = await supabase
        .from('astro_spot_advantages')
        .insert(advantages);

      if (advantagesError) throw advantagesError;

      toast.success(t("Astro spot created successfully!", "天文观测点创建成功！"));
      navigate('/location/' + state.latitude + ',' + state.longitude);
    } catch (error: any) {
      toast.error(t("Failed to create astro spot", "创建天文观测点失败"), {
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 flex flex-col">
      <NavBar />
      <main className="flex-grow container max-w-2xl mx-auto pt-28 pb-16 px-4">
        <h1 className="text-3xl font-bold text-primary mb-6">
          {t("Create Astro Spot", "创建天文观测点")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-primary-foreground">
                {t("Location Name", "位置名称")}
              </span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
                placeholder={t("Enter location name", "输入位置名称")}
              />
            </label>

            <div>
              <h3 className="text-sm font-medium text-primary-foreground mb-3">
                {t("Location Types", "位置类型")} *
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SPOT_TYPES.map(type => (
                  <label
                    key={type.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-primary/20 hover:bg-primary/10"
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
                    <span className="text-sm">{type.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-primary-foreground mb-3">
                {t("Location Advantages", "位置优势")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ADVANTAGES.map(advantage => (
                  <label
                    key={advantage}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-primary/20 hover:bg-primary/10"
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
                    <span className="text-sm">{advantage}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block">
                <span className="text-sm font-medium text-primary-foreground">
                  {t("Description", "描述")}
                </span>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                  placeholder={t("Describe this location...", "描述这个位置...")}
                  maxLength={1000}
                />
                <span className="text-xs text-muted-foreground mt-1 block">
                  {description.length}/1000
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("Creating...", "创建中...") : t("Create Spot", "创建观测点")}
            </Button>
          </div>
        </form>
      </main>
      <AboutFooter />
    </div>
  );
};

export default CreateAstroSpot;
