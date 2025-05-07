
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { UserTagsProps } from './tags/UserTagsTypes';
import { useTagsManagement } from './tags/useTagsManagement';
import LoadingTags from './tags/LoadingTags';
import TagsDisplay from './tags/TagsDisplay';
import TagsEditor from './tags/TagsEditor';

const UserTags: React.FC<UserTagsProps> = ({
  tags,
  loading,
  editable = false,
  showAddNew = false,
  onAddTag,
  onRemoveTag,
  className = '',
  userId
}) => {
  const { t } = useLanguage();
  
  const {
    isEditing,
    selectedTags,
    processingTags,
    displayTags,
    isLoading,
    handleTagToggle,
    startEditing,
    saveChanges,
    cancelEditing
  } = useTagsManagement({
    initialTags: tags,
    loading,
    userId,
    onAddTag,
    onRemoveTag
  });

  if (isLoading) {
    return <LoadingTags className={className} />;
  }
  
  if (displayTags.length === 0 && !showAddNew) {
    return null;
  }

  return (
    <div className={className}>
      {!isEditing ? (
        <TagsDisplay 
          tags={displayTags} 
          editable={editable} 
          onEditClick={startEditing} 
        />
      ) : (
        <TagsEditor
          selectedTags={selectedTags}
          processingTags={processingTags}
          onTagToggle={handleTagToggle}
          onSave={saveChanges}
          onCancel={cancelEditing}
        />
      )}
    </div>
  );
};

export default UserTags;
