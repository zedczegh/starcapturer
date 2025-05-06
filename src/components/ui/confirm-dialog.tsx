
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
}) => {
  const { t } = useLanguage();
  
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-cosmic-900/95 border border-cosmic-700/50 backdrop-blur-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-cosmic-50">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-cosmic-200">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-cosmic-800 hover:bg-cosmic-700 text-cosmic-100 border-cosmic-700/50">
            {cancelText || t("Cancel", "取消")}
          </AlertDialogCancel>
          <AlertDialogAction 
            className="bg-primary hover:bg-primary/90"
            onClick={handleConfirm}
          >
            {confirmText || t("Confirm", "确认")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
