
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { UseFormRegister } from 'react-hook-form';
import ProfileBenefits from './ProfileBenefits';
import ProfileTagsSelector from './ProfileTagsSelector';

interface ProfileFormValues {
  username: string;
}

interface ProfileFormProps {
  register: UseFormRegister<ProfileFormValues>;
  loading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
}

const ALL_TAGS = [
  "Professional Astronomer",
  "Amateur Astronomer",
  "Astrophotographer",
  "Meteorology Enthusiast",
  "Cosmos Lover",
  "Traveler",
  "Dark Sky Volunteer"
];

const ProfileForm = ({ register, loading, onSubmit, tags, setTags }: ProfileFormProps) => {
  const { t } = useLanguage();
  const handleTagChange = (tag: string, checked: boolean) => {
    if (checked && !tags.includes(tag)) {
      setTags([...tags, tag]);
    } else if (!checked) {
      setTags(tags.filter((t) => t !== tag));
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-white mb-2 block">
              {t("Username", "用户名")}
            </Label>
            <div className="relative">
              <Input
                id="username"
                {...register('username', { required: true, minLength: 3 })}
                className="pl-10 bg-cosmic-800 border-cosmic-700 text-white focus:border-primary"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-400">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
          {/* Tag selector */}
          <ProfileTagsSelector selectedTags={tags} onChange={handleTagChange} disabled={loading} />
        </div>

        <ProfileBenefits />
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-primary to-[#8A6FD6] hover:opacity-90 text-white px-6"
          disabled={loading}
        >
          {loading ? t("Updating...", "更新中...") : t("Save Changes", "保存更改")}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
