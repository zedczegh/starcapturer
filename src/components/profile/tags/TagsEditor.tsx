
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { COMMON_TAGS } from './TagColors';

interface TagsEditorProps {
  selectedTags: {[key: string]: boolean};
  processingTags: {[key: string]: boolean};
  onTagToggle: (tagName: string, checked: boolean) => Promise<void>;
  onSave: () => void;
  onCancel: () => void;
}

const TagsEditor: React.FC<TagsEditorProps> = ({
  selectedTags,
  processingTags,
  onTagToggle,
  onSave,
  onCancel
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {COMMON_TAGS.map((tagName) => (
          <label key={tagName} className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={selectedTags[tagName] || false}
              onCheckedChange={(checked) => onTagToggle(tagName, !!checked)}
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
        <Button size="sm" onClick={onSave}>
          {t('Save', '保存')}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCancel}
          className="text-cosmic-400"
        >
          {t('Cancel', '取消')}
        </Button>
      </div>
    </div>
  );
};

export default TagsEditor;
