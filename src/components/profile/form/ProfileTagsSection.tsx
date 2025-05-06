
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import UserTags from '../UserTags';
import { UserTag } from '@/hooks/useUserTags';

interface ProfileTagsSectionProps {
  tags: UserTag[];
  loadingTags: boolean;
  onAddTag: (tagName: string) => Promise<any>;
  onRemoveTag: (tagId: string) => Promise<boolean>;
}

const ProfileTagsSection: React.FC<ProfileTagsSectionProps> = ({ 
  tags, 
  loadingTags, 
  onAddTag, 
  onRemoveTag 
}) => {
  const { t } = useLanguage();

  return (
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
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
      />
    </div>
  );
};

export default ProfileTagsSection;
