
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserTag } from './UserTagsTypes';
import { addTagForUser, removeTagForUser, fetchTagsForUser } from './TagOperations';

interface UseTagsManagementProps {
  initialTags: UserTag[];
  loading: boolean;
  userId?: string;
  onAddTag?: (tagName: string) => Promise<any>;
  onRemoveTag?: (tagId: string) => Promise<boolean>;
}

export function useTagsManagement({
  initialTags,
  loading,
  userId,
  onAddTag,
  onRemoveTag
}: UseTagsManagementProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTags, setSelectedTags] = useState<{[key: string]: boolean}>({});
  const [processingTags, setProcessingTags] = useState<{[key: string]: boolean}>({});
  const [localTags, setLocalTags] = useState<UserTag[]>([]);
  const [localLoading, setLocalLoading] = useState(false);

  // Use either provided tags or fetch directly if userId is provided
  useEffect(() => {
    if (userId && (initialTags.length === 0 || loading)) {
      const loadDirectTags = async () => {
        setLocalLoading(true);
        try {
          const fetchedTags = await fetchTagsForUser(userId);
          setLocalTags(fetchedTags);
        } catch (err) {
          console.error("Error loading tags:", err);
        } finally {
          setLocalLoading(false);
        }
      };
      
      loadDirectTags();
    } else {
      setLocalTags(initialTags);
    }
  }, [userId, initialTags, loading]);

  // Initialize selected tags based on current user tags
  useEffect(() => {
    const tagsToUse = localTags.length > 0 ? localTags : initialTags;
    
    if (tagsToUse && tagsToUse.length > 0) {
      const tagMap: {[key: string]: boolean} = {};
      tagsToUse.forEach(tag => {
        tagMap[tag.name] = true;
      });
      setSelectedTags(tagMap);
    }
  }, [localTags, initialTags]);

  const handleTagToggle = async (tagName: string, checked: boolean) => {
    try {
      // Set this tag as processing
      setProcessingTags(prev => ({ ...prev, [tagName]: true }));
      
      // Find if the tag already exists in the user's tags
      const tagsToCheck = localTags.length > 0 ? localTags : initialTags;
      const existingTag = tagsToCheck.find(t => t.name.toLowerCase() === tagName.toLowerCase());
      
      if (checked && !existingTag) {
        // Add new tag - either through prop or direct operation
        if (userId) {
          const newTag = await addTagForUser(userId, tagName);
          if (newTag) {
            setLocalTags(prev => [...prev, { 
              id: newTag.id, 
              name: newTag.tag,
              icon_url: null
            }]);
          }
        } else if (onAddTag) {
          await onAddTag(tagName);
        }
      } else if (!checked && existingTag) {
        // Remove existing tag
        if (userId) {
          const removed = await removeTagForUser(existingTag.id);
          if (removed) {
            setLocalTags(prev => prev.filter(t => t.id !== existingTag.id));
          }
        } else if (onRemoveTag) {
          await onRemoveTag(existingTag.id);
        }
      }
      
      setSelectedTags(prev => ({
        ...prev,
        [tagName]: checked
      }));
    } catch (error) {
      console.error("Error toggling tag:", error);
      toast.error(t('Failed to update tag', '更新标签失败'));
    } finally {
      setProcessingTags(prev => ({ ...prev, [tagName]: false }));
    }
  };

  const startEditing = () => setIsEditing(true);
  const saveChanges = () => setIsEditing(false);
  const cancelEditing = () => setIsEditing(false);
  
  const isLoading = localLoading || loading;
  const displayTags = localTags.length > 0 ? localTags : initialTags;

  return {
    isEditing,
    selectedTags,
    processingTags,
    displayTags,
    isLoading,
    handleTagToggle,
    startEditing,
    saveChanges,
    cancelEditing
  };
}
