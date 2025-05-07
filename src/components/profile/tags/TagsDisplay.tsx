
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserTag } from './UserTagsTypes';
import TagBadge from './TagBadge';

interface TagsDisplayProps {
  tags: UserTag[];
  editable: boolean;
  onEditClick: () => void;
}

const TagsDisplay: React.FC<TagsDisplayProps> = ({ tags, editable, onEditClick }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <TagBadge key={tag.id} tag={tag} index={index} />
      ))}
      
      {editable && (
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-transparent border-dashed border-cosmic-700/50 text-cosmic-400 hover:text-cosmic-200 hover:border-cosmic-500 hover:bg-cosmic-800/30"
          onClick={onEditClick}
        >
          <Plus className="h-3 w-3 mr-1" />
          {t('Manage tags', '管理标签')}
        </Button>
      )}
    </div>
  );
};

export default TagsDisplay;
