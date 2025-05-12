
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { UseFormRegister } from 'react-hook-form';
import ProfileBenefits from './ProfileBenefits';
import ProfileTagsSelector from './ProfileTagsSelector';
import { Textarea } from '@/components/ui/textarea';

interface ProfileFormValues {
  username: string;
  bio: string;
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
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-cosmic-800/30 p-5 rounded-lg border border-cosmic-700/30">
            <Label htmlFor="username" className="text-white mb-2 block text-lg">
              {t("Username", "用户名")}
            </Label>
            <div className="relative">
              <Input
                id="username"
                {...register('username', { required: true, minLength: 3 })}
                className="pl-10 bg-cosmic-800/50 border-cosmic-700/40 text-white focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-400">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-cosmic-800/30 p-5 rounded-lg border border-cosmic-700/30">
            <Label htmlFor="bio" className="text-white mb-2 block text-lg">
              {t("Bio", "个人简介")}
            </Label>
            <Textarea
              id="bio"
              {...register('bio')}
              className="bg-cosmic-800/50 border-cosmic-700/40 text-white focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder={t("Tell us about yourself...", "介绍一下你自己...")}
            />
          </div>
          
          {/* Tag selector */}
          <div className="bg-cosmic-800/30 p-5 rounded-lg border border-cosmic-700/30">
            <ProfileTagsSelector selectedTags={tags} onChange={handleTagChange} disabled={loading} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <ProfileBenefits />
          <div className="flex justify-end mt-auto">
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-primary to-[#8A6FD6] hover:opacity-90 text-white px-8 py-6 shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? t("Updating...", "更新中...") : t("Save Changes", "保存更改")}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ProfileForm;
