import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProfileMottoProps {
  motto: string | null;
  onSave: (newMotto: string) => void;
  isOwner: boolean;
}

const ProfileMotto: React.FC<ProfileMottoProps> = ({ motto, onSave, isOwner }) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(motto || '');

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(motto || '');
    setIsEditing(false);
  };

  if (!isOwner && !motto) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      {isEditing ? (
        <div className="flex items-center gap-2 w-full">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={t("How you feel now...", "现在的心情...")}
            className="flex-1 h-8 text-sm bg-cosmic-800/40 border-primary/20"
            maxLength={100}
            autoFocus
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSave}
            className="h-8 w-8"
          >
            <Check className="h-4 w-4 text-green-400" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            className="h-8 w-8"
          >
            <X className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          {motto ? (
            <p className="text-cosmic-300 text-sm italic">
              "{motto}"
            </p>
          ) : (
            isOwner && (
              <p className="text-cosmic-400 text-sm italic">
                {t("Add your motto...", "添加你的座右铭...")}
              </p>
            )
          )}
          {isOwner && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="h-3 w-3 text-cosmic-400" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileMotto;
