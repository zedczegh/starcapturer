
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
      <div className="space-y-8">
        {/* Personal Information Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-[#8A6FD6] rounded-full"></div>
            {t("Personal Information", "个人信息")}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-cosmic-800/30 to-cosmic-900/20 p-6 rounded-xl border border-cosmic-700/20 backdrop-blur-sm">
              <Label htmlFor="username" className="text-white mb-3 block text-base font-medium">
                {t("Username", "用户名")}
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  {...register('username', { required: true, minLength: 3 })}
                  className="pl-10 bg-cosmic-800/50 border-cosmic-700/30 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-400">
                  <User className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cosmic-800/30 to-cosmic-900/20 p-6 rounded-xl border border-cosmic-700/20 backdrop-blur-sm">
              <Label htmlFor="bio" className="text-white mb-3 block text-base font-medium">
                {t("Bio", "个人简介")}
              </Label>
              <Textarea
                id="bio"
                {...register('bio')}
                className="bg-cosmic-800/50 border-cosmic-700/30 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg min-h-[100px]"
                placeholder={t("Tell us about your astronomical journey...", "介绍一下你的天文之旅...")}
              />
            </div>
          </div>
        </div>
        
        {/* Interests & Tags Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-[#8A6FD6] rounded-full"></div>
            {t("Astronomy Interests", "天文兴趣")}
          </h3>
          <ProfileTagsSelector selectedTags={tags} onChange={handleTagChange} disabled={loading} />
        </div>

        {/* Benefits Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-[#8A6FD6] rounded-full"></div>
            {t("Profile Benefits", "个人资料优势")}
          </h3>
          <ProfileBenefits />
        </div>

        {/* Save Button */}
        <div className="flex justify-center pt-6">
          <Button 
            type="submit" 
            size="lg"
            className="bg-gradient-to-r from-primary to-[#8A6FD6] hover:opacity-90 text-white px-12 py-4 rounded-xl shadow-lg shadow-primary/20 font-semibold text-base transition-all duration-300 hover:scale-[1.02]"
            disabled={loading}
          >
            {loading ? t("Updating Profile...", "更新个人资料中...") : t("Save Profile Changes", "保存个人资料更改")}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ProfileForm;
