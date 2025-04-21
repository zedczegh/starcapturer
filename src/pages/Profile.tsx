
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ProfileForm from '@/components/profile/ProfileForm';
import { Loader2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t("Authentication required", "需要认证"), {
          description: t("Please sign in to view your profile", "请登录以查看您的个人资料")
        });
        navigate('/photo-points');
        return;
      }
      
      fetchProfile(session.user.id);
    };

    checkSession();
  }, [navigate, t]);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, date_of_birth')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const profileData: Profile = {
          username: data.username || '',
          avatar_url: data.avatar_url,
          date_of_birth: data.date_of_birth || null
        };
        
        setProfile(profileData);
        setValue('username', data.username || '');
        setValue('date_of_birth', data.date_of_birth || '');
        setAvatarUrl(data.avatar_url);
      } else {
        // Create profile if it doesn't exist
        await supabase.from('profiles').insert({
          id: userId,
          username: null,
          avatar_url: null,
          date_of_birth: null
        });
        
        setProfile({
          username: null,
          avatar_url: null,
          date_of_birth: null
        });
      }
    } catch (error: any) {
      toast.error(t("Failed to load profile", "加载个人资料失败"), {
        description: error.message
      });
      console.error("Profile fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    }
  };

  const onSubmit = async (formData: ProfileFormValues) => {
    if (!user) {
      toast.error(t("Authentication required", "需要认证"));
      return;
    }

    try {
      setSaving(true);

      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        setUploadingAvatar(true);
        
        // First, check if the avatars bucket exists
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          toast.error(t("Storage error", "存储错误"), {
            description: bucketsError.message
          });
          setUploadingAvatar(false);
          setSaving(false);
          return;
        }
        
        // If avatars bucket doesn't exist, handle gracefully
        const avatarsBucketExists = buckets.some(bucket => bucket.name === 'avatars');
        
        if (!avatarsBucketExists) {
          toast.error(t("Avatar upload not available", "头像上传功能不可用"), {
            description: t("Storage not configured. Profile saved without avatar.", "存储未配置。个人资料已保存，但未包含头像。")
          });
        } else {
          // Proceed with upload
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
            setSaving(false);
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

          newAvatarUrl = publicUrl;
        }
        setUploadingAvatar(false);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: formData.username,
          date_of_birth: formData.date_of_birth || null,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (updateError) throw updateError;

      toast.success(t("Profile updated successfully", "个人资料更新成功"));
    } catch (error: any) {
      toast.error(t("Update failed", "更新失败"), {
        description: error.message
      });
      console.error("Profile update error:", error);
    } finally {
      setSaving(false);
    }
  };

  const removeAvatar = () => {
    setAvatarUrl(null);
    setAvatarFile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8 pt-24 flex justify-center items-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-cosmic-300">{t("Loading profile...", "正在加载个人资料...")}</p>
          </div>
        </div>
      </div>
    );
  }

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
              
              <ProfileAvatar 
                avatarUrl={avatarUrl}
                onAvatarChange={handleAvatarChange}
                onRemoveAvatar={removeAvatar}
                uploadingAvatar={uploadingAvatar}
              />
            </div>

            <Separator className="bg-cosmic-800" />
            
            <ProfileForm 
              register={register}
              loading={saving}
              onSubmit={handleSubmit(onSubmit)}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
