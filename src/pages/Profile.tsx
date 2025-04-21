
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

interface ProfileFormValues {
  username: string;
  date_of_birth: string;
}

const Profile = () => {
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
      username: '',
      date_of_birth: ''
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
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
      <NavBar />
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
    </div>
  );
};

export default Profile;
