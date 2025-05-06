
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserTag } from '@/hooks/useUserTags';
import TagSelector from './TagSelector';

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

interface UserTagsProps {
  tags: UserTag[];
  loading: boolean;
  editable?: boolean;
  showAddNew?: boolean;
  onAddTag?: (tagName: string) => Promise<any>;
  onRemoveTag?: (tagId: string) => Promise<boolean>;
  className?: string;
}

const UserTags: React.FC<UserTagsProps> = ({
  tags,
  loading,
  editable = false,
  showAddNew = false,
  onAddTag,
  onRemoveTag,
  className = ''
}) => {
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = React.useState(false);
  const [showAddForm, setShowAddForm] = React.useState(false);

  const handleAddTag = async (tagName: string) => {
    if (!tagName.trim() || !onAddTag) return;
    
    try {
      setIsAdding(true);
      await onAddTag(tagName.trim());
      setShowAddForm(false); // Close the form after adding
    } catch (error) {
      console.error("Error adding tag:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // Get an array of tag names from the tags array
  const tagNames = tags.map(tag => tag.name);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-cosmic-400" />
        <span className="text-sm text-cosmic-400">
          {t('Loading tags...', '加载标签中...')}
        </span>
      </div>
    );
  }

  if (tags.length === 0 && !showAddNew) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge 
            key={tag.id} 
            variant="outline" 
            className={`${TAG_COLORS[index % TAG_COLORS.length]} px-2 py-1 hover:opacity-90`}
          >
            <Tag className="h-3 w-3 mr-1.5 text-current opacity-80" />
            {tag.name}
            {editable && onRemoveTag && (
              <button
                className="ml-1.5 text-current opacity-80 hover:opacity-100"
                onClick={() => onRemoveTag(tag.id)}
                aria-label={`Remove ${tag.name} tag`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        
        {showAddNew && !showAddForm && (
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-transparent border-dashed border-cosmic-700/50 text-cosmic-400 hover:text-cosmic-200 hover:border-cosmic-500 hover:bg-cosmic-800/30"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            {t('Add tag', '添加标签')}
          </Button>
        )}
      </div>
      
      {showAddForm && (
        <div className="mt-3">
          <div className="mb-2">
            <TagSelector 
              onSelect={handleAddTag}
              selectedTags={tagNames || []}
              disabled={isAdding}
            />
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAddForm(false)}
            className="h-8 px-2 text-cosmic-400"
          >
            {t('Cancel', '取消')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserTags;
