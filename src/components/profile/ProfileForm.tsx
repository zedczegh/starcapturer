
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, Pencil } from 'lucide-react';
import ProfileBenefits from './ProfileBenefits';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Profile {
  username: string | null;
  date_of_birth: string | null;
}

interface ProfileFormProps {
  loading: boolean;
  profile: Profile | null;
}

const ProfileForm = ({ loading, profile }: ProfileFormProps) => {
  const { t } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<{
    username: string;
    date_of_birth: string;
  }>({
    defaultValues: {
      username: profile?.username || '',
      date_of_birth: profile?.date_of_birth || '',
    }
  });

  const onSubmit = async (data: { username: string; date_of_birth: string }) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          date_of_birth: data.date_of_birth,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success(t("Profile updated successfully", "个人资料更新成功"));
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(t("Failed to update profile", "更新个人资料失败"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                disabled={loading || isSubmitting}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-400">
                <User className="w-5 h-5" />
              </div>
            </div>
            {errors.username?.type === 'required' && (
              <p className="text-red-500 text-sm mt-1">{t("Username is required", "用户名是必填项")}</p>
            )}
            {errors.username?.type === 'minLength' && (
              <p className="text-red-500 text-sm mt-1">{t("Username must be at least 3 characters", "用户名至少需要3个字符")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="date_of_birth" className="text-white mb-2 block">
              {t("Date of Birth", "出生日期")}
            </Label>
            <div className="relative">
              <Input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth')}
                className="pl-10 bg-cosmic-800 border-cosmic-700 text-white focus:border-primary"
                disabled={loading || isSubmitting}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-400">
                <Pencil className="w-5 h-5" />
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
          disabled={loading || isSubmitting}
        >
          {isSubmitting ? t("Updating...", "更新中...") : t("Save Changes", "保存更改")}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
