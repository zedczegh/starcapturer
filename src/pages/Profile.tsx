
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Camera, Pencil, X, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { Label } from '@/components/ui/label';

interface Profile {
  username: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
}

interface ProfileFormValues {
  username: string;
  date_of_birth: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { register, handleSubmit, setValue } = useForm<ProfileFormValues>({
    defaultValues: {
      username: '',
      date_of_birth: ''
    }
  });

  useEffect(() => {
    if (!user) {
      navigate('/photo-points');
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, date_of_birth')
        .eq('id', user.id)
        .single();

      if (error) {
        toast.error(t("Failed to load profile", "加载个人资料失败"));
        return;
      }

      if (data) {
        // Create a profile object that matches our interface
        const profileData: Profile = {
          username: data.username || '',
          avatar_url: data.avatar_url,
          date_of_birth: data.date_of_birth || null
        };
        
        setProfile(profileData);
        setValue('username', data.username || '');
        setValue('date_of_birth', data.date_of_birth || '');
        setAvatarUrl(data.avatar_url);
      }
    };

    fetchProfile();
  }, [user, navigate, t, setValue]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    }
  };

  const onSubmit = async (formData: ProfileFormValues) => {
    if (!user) return;

    try {
      setLoading(true);

      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        setUploadingAvatar(true);
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        if (uploadError) {
          if (uploadError.message.includes('Bucket not found')) {
            toast.error(t("Avatar upload failed: Storage bucket not configured", "头像上传失败：存储桶未配置"));
          } else {
            toast.error(uploadError.message);
          }
          setUploadingAvatar(false);
          setLoading(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        newAvatarUrl = publicUrl;
        setUploadingAvatar(false);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          date_of_birth: formData.date_of_birth || null,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success(t("Profile updated successfully", "个人资料更新成功"));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeAvatar = () => {
    setAvatarUrl(null);
    setAvatarFile(null);
  };

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
        <Card className="glassmorphism p-8 rounded-xl shadow-glow">
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {t("Profile", "个人资料")}
                </h1>
                <p className="text-cosmic-300">
                  {t("Update your personal information", "更新您的个人信息")}
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="relative w-28 h-28">
                  {avatarUrl ? (
                    <div className="relative group">
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover border-2 border-primary shadow-glow"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={removeAvatar} 
                          className="text-white p-1 rounded-full hover:text-red-400 transition-colors"
                          type="button"
                          aria-label={t("Remove avatar", "删除头像")}
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-cosmic-800 border-2 border-cosmic-700 shadow-glow flex items-center justify-center">
                      <User className="w-12 h-12 text-cosmic-400" />
                    </div>
                  )}
                  
                  <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-primary/90 transition-all">
                    <Camera className="w-5 h-5" />
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-cosmic-400 text-sm mt-2">
                  {uploadingAvatar ? t("Uploading...", "上传中...") : t("Click to change", "点击更改")}
                </p>
              </div>
            </div>

            <Separator className="bg-cosmic-800" />
            
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
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-400">
                        <User className="w-5 h-5" />
                      </div>
                    </div>
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
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-400">
                        <Pencil className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-cosmic-800/50 rounded-lg p-4 border border-cosmic-700/50">
                  <h3 className="font-medium text-cosmic-100 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    {t("Profile Benefits", "个人资料优势")}
                  </h3>
                  <ul className="space-y-2 text-cosmic-300">
                    <li className="flex items-start gap-2">
                      <div className="min-w-5 mt-1">•</div>
                      <span>{t("Personalized stargazing recommendations", "个性化的观星推荐")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-5 mt-1">•</div>
                      <span>{t("Save favorite astronomy locations", "保存喜爱的天文位置")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-5 mt-1">•</div>
                      <span>{t("Track your observation history", "跟踪您的观测历史")}</span>
                    </li>
                  </ul>
                </div>
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
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
