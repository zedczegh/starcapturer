import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import ProfileLoader from '@/components/profile/ProfileLoader';
import ProfileMain from '@/components/profile/ProfileMain';
import { useProfile } from '@/hooks/profile/useProfile';
import AboutFooter from '@/components/about/AboutFooter';

interface ProfileFormValues {
  username: string;
}

export const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    profile,
    setProfile,
    avatarFile,
    setAvatarFile,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    setUploadingAvatar,
    randomTip,
    fetchProfile
  } = useProfile();

  const { register, handleSubmit, setValue } = useForm<ProfileFormValues>({
    defaultValues: {
      username: ''
    }
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error(t("Authentication required", "需要认证"), {
            description: t("Please sign in to view your profile", "请登录以查看您的个人资料")
          });
          navigate('/photo-points');
          return;
        }

        await fetchProfile(session.user.id, setValue);
      } catch (error) {
        setProfile({
          username: null,
          avatar_url: null,
          date_of_birth: null
        });
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate, t, setProfile, fetchProfile, setValue]);

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
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
          toast.error(t("Storage error", "存储错误"), { description: bucketsError.message });
          setUploadingAvatar(false);
          setSaving(false);
          return;
        }

        const avatarsBucketExists = buckets.some(bucket => bucket.name === 'avatars');
        if (!avatarsBucketExists) {
          toast.error(t("Avatar upload not available", "头像上传功能不可用"), {
            description: t("Storage not configured. Profile saved without avatar.", "存储未配置。个人资料已保存，但未包含头像。")
          });
        } else {
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${user.id}-${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile);
          if (uploadError) {
            toast.error(uploadError.message);
            setUploadingAvatar(false);
            setSaving(false);
            return;
          }
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
          newAvatarUrl = publicUrl;
        }
        setUploadingAvatar(false);
      }

      // Check if profile exists first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username: formData.username,
            avatar_url: newAvatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) throw updateError;
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: formData.username,
            avatar_url: newAvatarUrl,
            updated_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
      }
      
      toast.success(t("Profile updated successfully", "个人资料更新成功"));
    } catch (error: any) {
      toast.error(t("Update failed", "更新失败"), { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const removeAvatar = () => {
    setAvatarUrl(null);
    setAvatarFile(null);
  };

  if (!authChecked || loading) return <ProfileLoader />;
  if (!user) return <ProfileLoader />;

  const displayUsername = profile?.username || t("Stargazer", "星空观察者");

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 flex flex-col">
      <NavBar />
      <main className="flex-grow">
        <ProfileMain
          displayUsername={displayUsername}
          avatarUrl={avatarUrl}
          onAvatarChange={handleAvatarChange}
          onRemoveAvatar={removeAvatar}
          uploadingAvatar={uploadingAvatar}
          astronomyTip={randomTip}
          register={register}
          saving={saving}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
        />
      </main>
      <AboutFooter />
    </div>
  );
};

export default Profile;
