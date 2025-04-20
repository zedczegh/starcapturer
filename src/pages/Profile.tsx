
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
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';

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
  const { user, refreshProfile } = useAuth();
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
      toast.error(t("Please sign in to view your profile", "请登录以查看您的个人资料"));
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, date_of_birth')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          toast.error(t("Failed to load profile", "加载个人资料失败"));
          return;
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
        }
      } catch (err) {
        console.error("Error in profile fetch:", err);
      }
    };

    fetchProfile();
  }, [user, navigate, t, setValue]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setAvatarFile(file);
        const previewUrl = URL.createObjectURL(file);
        setAvatarUrl(previewUrl);
        
        // Upload the file immediately when selected
        await uploadAvatar(file);
      } catch (err) {
        console.error("Error handling avatar change:", err);
        toast.error(t("Failed to process image", "处理图像失败"));
      }
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    
    try {
      setUploadingAvatar(true);
      
      // Create a unique file name to prevent collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      // Upload the file
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error(t("Avatar upload failed", "头像上传失败") + `: ${uploadError.message}`);
        return;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        toast.error(t("Failed to update avatar", "更新头像失败"));
        return;
      }

      // Update the avatar URL state
      setAvatarUrl(publicUrl);
      
      // Refresh the user profile context
      await refreshProfile();
      
      toast.success(t("Avatar updated successfully", "头像更新成功"));
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(t("Avatar upload failed", "头像上传失败"));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSubmit = async (formData: ProfileFormValues) => {
    if (!user) return;

    try {
      setLoading(true);

      // Update profile data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          date_of_birth: formData.date_of_birth || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw updateError;
      }

      toast.success(t("Profile updated successfully", "个人资料更新成功"));
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(t("Failed to update profile", "更新个人资料失败") + `: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user || !avatarUrl) return;
    
    try {
      setLoading(true);
      
      // If the avatar URL is from storage, extract the filename and delete it
      const storageMatch = avatarUrl.match(/\/avatars\/([^?]+)/);
      if (storageMatch && storageMatch[1]) {
        const fileName = decodeURIComponent(storageMatch[1]);
        await supabase.storage.from('avatars').remove([fileName]);
      }
      
      // Update profile with null avatar_url
      await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      // Clear state
      setAvatarUrl(null);
      setAvatarFile(null);
      
      // Refresh profile context
      await refreshProfile();
      
      toast.success(t("Avatar removed successfully", "头像已成功删除"));
    } catch (error: any) {
      console.error("Remove avatar error:", error);
      toast.error(t("Failed to remove avatar", "删除头像失败"));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
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
              loading={loading}
              onSubmit={handleSubmit(onSubmit)}
            />

            <Separator className="bg-cosmic-800" />
            
            <ChangePasswordForm />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
