
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { UserTag } from '@/hooks/useUserTags';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Colors for the tag badges
const TAG_COLORS = [
  'bg-purple-800/60 text-purple-200 border-purple-700/50',
  'bg-blue-800/60 text-blue-200 border-blue-700/50',
  'bg-green-800/60 text-green-200 border-green-700/50',
  'bg-amber-800/60 text-amber-200 border-amber-700/50',
  'bg-rose-800/60 text-rose-200 border-rose-700/50',
  'bg-indigo-800/60 text-indigo-200 border-indigo-700/50',
  'bg-teal-800/60 text-teal-200 border-teal-700/50',
  'bg-pink-800/60 text-pink-200 border-pink-700/50',
];

// Common tags that users can select from
const COMMON_TAGS = [
  'Astronomy',
  'Astrophotography',
  'Stargazing',
  'Milky Way',
  'Telescopes',
  'Planets',
  'Galaxies',
  'Nebulae',
  'Dark Sky',
  'Meteor Shower',
  'Aurora',
  'Space Science',
  'Cosmology',
  'Night Photography',
  'Citizen Science',
  'Professional Astronomer',
  'Amateur Astronomer',
  'Meteorology',
  'Cosmos Lover',
  'Traveler',
  'Dark Sky Volunteer',
];

interface UserTagsProps {
  tags: UserTag[];
  loading: boolean;
  editable?: boolean;
  showAddNew?: boolean;
  onAddTag?: (tagName: string) => Promise<any>;
  onRemoveTag?: (tagId: string) => Promise<boolean>;
  className?: string;
  userId?: string; // Optional userId for direct tag operations
}

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
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTags, setSelectedTags] = useState<{[key: string]: boolean}>({});
  const [processingTags, setProcessingTags] = useState<{[key: string]: boolean}>({});
  const [localTags, setLocalTags] = useState<UserTag[]>([]);
  const [localLoading, setLocalLoading] = useState(false);

  // Create profiles for users if they don't exist
  const ensureProfileExists = useCallback(async (uid: string) => {
    try {
      // Check if profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', uid)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking profile existence:", error);
        return false;
      }
      
      if (!data) {
        // Create profile if doesn't exist
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{ id: uid }]);
          
        if (createError) {
          console.error("Error creating profile:", createError);
          return false;
        }
        
        console.log("Created new profile for user:", uid);
      }
      
      return true;
    } catch (err) {
      console.error("Failed to ensure profile exists:", err);
      return false;
    }
  }, []);

  // Direct tag operations if userId is provided
  const addTagForUser = useCallback(async (uid: string, tagName: string) => {
    try {
      if (!await ensureProfileExists(uid)) {
        return null;
      }
      
      // Check if tag already exists
      const { data: existingTags } = await supabase
        .from('profile_tags')
        .select('id, tag')
        .eq('user_id', uid)
        .eq('tag', tagName);
        
      if (existingTags && existingTags.length > 0) {
        return existingTags[0];
      }
      
      // Add the tag
      const { data, error } = await supabase
        .from('profile_tags')
        .insert({ user_id: uid, tag: tagName })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error("Error adding tag directly:", err);
      return null;
    }
  }, [ensureProfileExists]);

  const removeTagForUser = useCallback(async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('profile_tags')
        .delete()
        .eq('id', tagId);
        
      if (error) {
        throw error;
      }
      
      return true;
    } catch (err) {
      console.error("Error removing tag directly:", err);
      return false;
    }
  }, []);

  // Use either provided tags or fetch directly if userId is provided
  useEffect(() => {
    if (userId && (tags.length === 0 || loading)) {
      const fetchDirectTags = async () => {
        try {
          setLocalLoading(true);
          
          console.log("Directly fetching tags for user:", userId);
          
          // Ensure the user has a profile
          await ensureProfileExists(userId);
          
          // Now fetch tags
          const { data: tagData, error } = await supabase
            .from('profile_tags')
            .select('id, tag')
            .eq('user_id', userId);
            
          if (error) throw error;
          
          if (tagData) {
            const fetchedTags = tagData.map(item => ({
              id: item.id,
              name: item.tag,
              icon_url: null
            }));
            
            setLocalTags(fetchedTags);
            console.log(`Directly fetched ${fetchedTags.length} tags for user:`, userId);
          }
        } catch (err) {
          console.error("Error directly fetching tags:", err);
        } finally {
          setLocalLoading(false);
        }
      };
      
      fetchDirectTags();
    } else {
      setLocalTags(tags);
    }
  }, [userId, tags, loading, ensureProfileExists]);

  // Initialize selected tags based on current user tags
  useEffect(() => {
    const tagsToUse = localTags.length > 0 ? localTags : tags;
    
    if (tagsToUse && tagsToUse.length > 0) {
      const tagMap: {[key: string]: boolean} = {};
      tagsToUse.forEach(tag => {
        tagMap[tag.name] = true;
      });
      setSelectedTags(tagMap);
    }
  }, [localTags, tags]);

  const handleTagToggle = async (tagName: string, checked: boolean) => {
    try {
      // Set this tag as processing
      setProcessingTags(prev => ({ ...prev, [tagName]: true }));
      
      // Find if the tag already exists in the user's tags
      const tagsToCheck = localTags.length > 0 ? localTags : tags;
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

  const saveChanges = () => {
    setIsEditing(false);
  };
  
  // Use local loading state or passed loading state
  const isLoading = localLoading || loading;

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-cosmic-400" />
        <span className="text-sm text-cosmic-400">
          {t('Loading tags...', '加载标签中...')}
        </span>
      </div>
    );
  }
  
  // Use local tags or passed tags
  const displayTags = localTags.length > 0 ? localTags : tags;

  if (displayTags.length === 0 && !showAddNew) {
    return null;
  }

  return (
    <div className={className}>
      {!isEditing ? (
        <div className="flex flex-wrap gap-2">
          {displayTags.map((tag, index) => (
            <Badge 
              key={tag.id} 
              variant="outline" 
              className={`${TAG_COLORS[index % TAG_COLORS.length]} px-2 py-1 hover:opacity-90`}
            >
              <Tag className="h-3 w-3 mr-1.5 text-current opacity-80" />
              {tag.name}
            </Badge>
          ))}
          
          {editable && (
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-transparent border-dashed border-cosmic-700/50 text-cosmic-400 hover:text-cosmic-200 hover:border-cosmic-500 hover:bg-cosmic-800/30"
              onClick={() => setIsEditing(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              {t('Manage tags', '管理标签')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {COMMON_TAGS.map((tagName) => (
              <label key={tagName} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={selectedTags[tagName] || false}
                  onCheckedChange={(checked) => handleTagToggle(tagName, !!checked)}
                  disabled={processingTags[tagName]}
                />
                <span className="text-sm text-cosmic-200 flex items-center">
                  {tagName}
                  {processingTags[tagName] && (
                    <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                  )}
                </span>
              </label>
            ))}
          </div>
          
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={saveChanges}>
              {t('Save', '保存')}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(false)}
              className="text-cosmic-400"
            >
              {t('Cancel', '取消')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTags;
