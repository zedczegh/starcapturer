
export interface UserTag {
  id: string;
  name: string;
  icon_url: string | null;
}

export interface UserTagsProps {
  tags: UserTag[];
  loading: boolean;
  editable?: boolean;
  showAddNew?: boolean;
  onAddTag?: (tagName: string) => Promise<any>;
  onRemoveTag?: (tagId: string) => Promise<boolean>;
  className?: string;
  userId?: string; // Optional userId for direct tag operations
}
