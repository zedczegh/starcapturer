
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useModal } from "@/contexts/ModalContext";

export function ConfirmDialog() {
  const { isOpen, modalOptions, closeModal } = useModal();

  if (!modalOptions) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={closeModal}>
      <AlertDialogContent className="glassmorphism border-cosmic-700/30">
        <AlertDialogHeader>
          <AlertDialogTitle>{modalOptions.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-cosmic-200">
            {modalOptions.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {modalOptions.buttons.cancel && (
            <AlertDialogCancel
              onClick={() => {
                modalOptions.buttons.cancel?.action?.();
                closeModal();
              }}
            >
              {modalOptions.buttons.cancel.label}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={() => {
              modalOptions.buttons.confirm.action?.();
              closeModal();
            }}
            className={modalOptions.buttons.confirm.variant === 'destructive' ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            {modalOptions.buttons.confirm.label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
