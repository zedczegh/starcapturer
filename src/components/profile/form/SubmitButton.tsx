
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface SubmitButtonProps {
  saving: boolean;
  avatarUploading: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ saving, avatarUploading }) => {
  const { t } = useLanguage();
  
  return (
    <Button
      type="submit"
      disabled={saving || avatarUploading}
      className="w-full bg-primary hover:bg-primary/90"
    >
      {saving || avatarUploading ? (
        <span className="flex items-center">
          <span className="animate-spin mr-2">⟳</span> 
          {t('Saving...', '保存中...')}
        </span>
      ) : (
        t('Save Profile', '保存资料')
      )}
    </Button>
  );
};

export default SubmitButton;
