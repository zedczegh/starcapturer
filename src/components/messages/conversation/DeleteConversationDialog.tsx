
import React from 'react';
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/contexts/LanguageContext';
import { ConversationPartner } from '@/hooks/messaging/useConversations';

interface DeleteConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  conversation: ConversationPartner | null;
  isProcessingAction: boolean;
}

const DeleteConversationDialog: React.FC<DeleteConversationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  conversation,
  isProcessingAction
}) => {
  const { t } = useLanguage();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-cosmic-950 border-cosmic-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            {t("Delete Conversation", "删除对话")}
          </DialogTitle>
          <DialogDescription className="text-cosmic-300">
            {t("This will permanently delete all messages between you and", "这将永久删除您与")} {conversation?.username}. {t("This action cannot be undone.", "此操作无法撤销。")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-cosmic-700 text-cosmic-300 hover:bg-cosmic-800 hover:text-white"
          >
            {t("Cancel", "取消")}
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirm}
            disabled={isProcessingAction}
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessingAction ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {t("Deleting...", "删除中...")}
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                {t("Delete", "删除")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConversationDialog;
