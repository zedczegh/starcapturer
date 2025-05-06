
import React, { createContext, useState, useContext } from 'react';
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

type ConfirmDialogProps = {
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
};

type ModalContextType = {
  confirmDialog: (props: ConfirmDialogProps) => void;
};

const ModalContext = createContext<ModalContextType>({
  confirmDialog: () => {},
});

export const useModal = () => useContext(ModalContext);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmProps, setConfirmProps] = useState<ConfirmDialogProps>({
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const confirmDialog = (props: ConfirmDialogProps) => {
    setConfirmProps(props);
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    confirmProps.onConfirm();
    setIsConfirmOpen(false);
  };

  return (
    <ModalContext.Provider value={{ confirmDialog }}>
      {children}

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="bg-cosmic-900 border-cosmic-700">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmProps.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-cosmic-300">
              {confirmProps.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-cosmic-800 border-cosmic-700 hover:bg-cosmic-800/70 text-cosmic-200">
              {confirmProps.cancelText || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-red-600 hover:bg-red-700">
              {confirmProps.confirmText || 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModalContext.Provider>
  );
};
