
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
import { v4 as uuidv4 } from 'uuid';

interface ProfileFormValues {
  username: string;
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
    fetchProfile,
    tags,
    setTags,
    saveProfileTags
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
        
        // Check if avatars bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.some(bucket => bucket.name === 'avatars')) {
          console.warn("Avatars bucket not found. This should be created via migration.");
        }
      } catch (error) {
        setProfile({
          username: null,
          avatar_url: null,
          date_of_birth: null,
          tags: [],
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

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return avatarUrl;
    
    try {
      setUploadingAvatar(true);
      
      // Check if storage bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarsBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
      
      if (!avatarsBucketExists) {
        toast.error(t("Cannot upload avatar", "无法上传头像"), {
          description: t("Storage is not configured properly.", "存储配置不正确。")
        });
        return null;
      }
      
      // Generate a unique file name
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}/${uuidv4()}.${fileExt}`;
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        toast.error(t("Avatar upload failed", "头像上传失败"), { 
          description: uploadError.message 
        });
        return null;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(t("Avatar upload failed", "头像上传失败"), { 
        description: error.message 
      });
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSubmit = async (formData: ProfileFormValues) => {
    if (!user) {
      toast.error(t("Authentication required", "需要认证"));
      return;
    }

    try {
      setSaving(true);
      
      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(user.id);
        if (!newAvatarUrl && avatarFile) {
          // If upload failed but user has selected a file, use previous avatar URL
          newAvatarUrl = profile?.avatar_url || null;
        }
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

      // Save tags
      await saveProfileTags(user.id, tags);

      toast.success(t("Profile updated successfully", "个人资料更新成功"), {
        description: avatarFile ? t("Your avatar has been updated", "您的头像已更新") : undefined,
        className: "toast-success"
      });
      
      // Update local state
      setProfile(prev => ({
        ...prev!,
        username: formData.username,
        avatar_url: newAvatarUrl
      }));
      
      // Reset avatar file state
      setAvatarFile(null);
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(t("Update failed", "更新失败"), { 
        description: error.message,
        className: "toast-error"
      });
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
          tags={tags}
          setTags={setTags}
        />
      </main>
      <AboutFooter />
    </div>
  );
};

export default Profile;
