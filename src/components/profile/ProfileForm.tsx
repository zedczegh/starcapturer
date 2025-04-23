
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { UseFormRegister } from 'react-hook-form';
import ProfileBenefits from './ProfileBenefits';

interface ProfileFormValues {
  username: string;
}

interface ProfileFormProps {
  register: UseFormRegister<ProfileFormValues>;
  loading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const ProfileForm = ({ register, loading, onSubmit }: ProfileFormProps) => {
  const { t } = useLanguage();

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
