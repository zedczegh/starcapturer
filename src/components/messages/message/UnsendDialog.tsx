
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface UnsendDialogProps {
  open: boolean;
  isProcessing: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUnsend: () => void;
  onCancel: () => void;
}

const UnsendDialog: React.FC<UnsendDialogProps> = ({
  open,
  isProcessing,
  onOpenChange,
  onUnsend,
  onCancel
}) => {
  const { t } = useLanguage();
  
  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isProcessing && !isOpen) {
          onOpenChange(isOpen);
        }
      }}
    >
      <AlertDialogContent className="bg-cosmic-900 border-cosmic-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            {t("Unsend Message", "撤回消息")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-cosmic-300">
            {t(
              "Are you sure you want to unsend this message? This cannot be undone.",
              "确定要撤回此消息吗？此操作无法撤销。"
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="bg-cosmic-800 text-cosmic-100 hover:bg-cosmic-700" 
            disabled={isProcessing}
            onClick={onCancel}
          >
            {t("Cancel", "取消")}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onUnsend}
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={isProcessing}
          >
            {isProcessing ? t("Processing...", "处理中...") : t("Unsend", "撤回")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UnsendDialog;
