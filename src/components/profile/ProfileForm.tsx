
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/profile/useProfile';
import { useUserTags } from '@/hooks/useUserTags';
import { useProfileForm } from '@/hooks/profile/useProfileForm';
import { useLanguage } from '@/contexts/LanguageContext';

// Component imports
import UsernameField, { ProfileFormValues } from './form/UsernameField';
import ProfileTagsSection from './form/ProfileTagsSection';
import SubmitButton from './form/SubmitButton';
import { toast } from 'sonner';

// Use the same type from UsernameField to ensure consistency
const formSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters.',
  }),
});

const ProfileForm = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    profile,
    fetchProfile,
  } = useProfile();

  const { 
    tags, 
    loading: loadingTags, 
    fetchUserTags,
    addUserTag,
    removeUserTag
  } = useUserTags();

  // Set up form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: profile?.username || '',
    },
  });

  const { handleSubmit, saving, avatarUploading } = useProfileForm(user);

  // Load profile data when component mounts
  useEffect(() => {
    const initializeProfile = async () => {
      if (user) {
        try {
          console.log("Initializing profile for user:", user.id);
          await fetchProfile(user.id, form.setValue);
          await fetchUserTags(user.id);
        } catch (error) {
          console.error("Error initializing profile:", error);
          toast.error(t('Failed to load profile', '加载个人资料失败'), {
            description: t('Please refresh the page and try again', '请刷新页面并重试')
          });
        }
      }
    };
    
    initializeProfile();
  }, [user, fetchProfile, form.setValue, fetchUserTags, t]);

  // Re-set form values when profile changes
  useEffect(() => {
    if (profile?.username) {
      console.log("Setting username in form to:", profile.username);
      form.setValue('username', profile.username);
    }
  }, [profile, form.setValue]);

  const handleAddTag = async (tagName: string) => {
    if (!user) {
      console.error("Cannot add tag: No user logged in");
      return null;
    }
    return addUserTag(user.id, tagName);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Username field */}
      <UsernameField 
        register={form.register} 
        errors={form.formState.errors}
        defaultValue={profile?.username || ''}
      />

      {/* User tags section */}
      <ProfileTagsSection
        tags={tags}
        loadingTags={loadingTags}
        onAddTag={handleAddTag}
        onRemoveTag={removeUserTag}
      />

      {/* Submit button */}
      <SubmitButton 
        saving={saving} 
        avatarUploading={avatarUploading} 
      />
    </form>
  );
};

export default ProfileForm;
