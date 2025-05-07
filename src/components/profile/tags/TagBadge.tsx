
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import { TAG_COLORS } from './TagColors';
import { UserTag } from './UserTagsTypes';

interface TagBadgeProps {
  tag: UserTag;
  index: number;
}

const TagBadge: React.FC<TagBadgeProps> = ({ tag, index }) => {
  return (
    <Badge 
      variant="outline" 
      className={`${TAG_COLORS[index % TAG_COLORS.length]} px-2 py-1 hover:opacity-90`}
    >
      <Tag className="h-3 w-3 mr-1.5 text-current opacity-80" />
      {tag.name}
    </Badge>
  );
};

export default TagBadge;
