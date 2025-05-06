import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/profile/useProfile';
import { useUserTags } from '@/hooks/useUserTags';
import UserTags from './UserTags';

const formSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters.',
  }),
});

type ProfileFormValues = z.infer<typeof formSchema>;

const ProfileForm = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    profile,
    setProfile,
    avatarFile,
    setAvatarFile,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    setUploadingAvatar,
    fetchProfile,
  } = useProfile();

  const { 
    tags, 
    loading: loadingTags, 
    fetchUserTags,
    addUserTag,
    removeUserTag
  } = useUserTags();

  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Set up form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
    },
  });

  // Load profile data when component mounts
  React.useEffect(() => {
    if (user) {
      fetchProfile(user.id, form.setValue);
      fetchUserTags(user.id);
    }
  }, [user, fetchProfile, form.setValue, fetchUserTags]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarUploading(true);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(`avatars/${user?.id}`, avatarFile);
    if (error) throw error;
    setAvatarUrl(data?.signedUrl);
    setAvatarUploading(false);
  };

  const handleAddTag = async (tagName: string) => {
    if (!user) return;
    return await addUserTag(user.id, tagName);
  };

  const handleRemoveTag = async (tagId: string) => {
    return await removeUserTag(tagId);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    try {
      setSaving(true);

      // Upload avatar if selected
      if (avatarFile) {
        await uploadAvatar();
      }

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? { ...prev, username: data.username } : null);

      toast.success(t('Profile updated successfully', '个人资料更新成功'));
    } catch (error: any) {
      toast.error(t('Failed to update profile', '更新个人资料失败'));
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar upload section */}
      <div className="space-y-4">
        <div className="flex flex-col items-center">
          <Label className="text-cosmic-300">
            {t('Upload Avatar', '上传头像')}
          </Label>
          <Input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="bg-cosmic-900/50 border-cosmic-700/50"
          />
          {avatarUploading && (
            <p className="text-sm text-cosmic-400">
              {t('Uploading avatar...', '上传头像中...')}
            </p>
          )}
        </div>
      </div>

      {/* Username field */}
      <div className="space-y-2">
        <Label htmlFor="username" className="text-cosmic-300">
          {t('Username', '用户名')}
        </Label>
        <Input
          id="username"
          {...form.register('username')}
          className="bg-cosmic-900/50 border-cosmic-700/50"
          placeholder={t('Enter your username', '输入您的用户名')}
        />
        {form.formState.errors.username && (
          <p className="text-sm text-red-500">
            {form.formState.errors.username.message}
          </p>
        )}
      </div>

      {/* User tags section */}
      <div className="space-y-2">
        <Label className="text-cosmic-300">
          {t('Your tags', '您的标签')}
        </Label>
        <p className="text-sm text-cosmic-400 mb-2">
          {t('Add tags to your profile to show your interests and expertise', 
             '为您的个人资料添加标签以展示您的兴趣和专长')}
        </p>
        
        <UserTags 
          tags={tags} 
          loading={loadingTags}
          editable={true}
          showAddNew={true}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={saving || avatarUploading}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {saving || avatarUploading ? (
          <span className="flex items-center">
            <span className="animate-spin mr-2">⟳</span> 
            {t('Saving...', '保存中...')}
          </span>
        ) : (
          t('Save Profile', '保存资料')
        )}
      </Button>
    </form>
  );
};

export default ProfileForm;
