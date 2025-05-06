
import React, { createContext, useContext, useState, ReactNode } from 'react';
import ConfirmDialog from '@/components/ui/confirm-dialog';

type ModalType = 'booking' | 'confirmation' | 'message' | null;

interface ConfirmDialogProps {
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  modalType: ModalType;
  modalData: any;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
  confirmDialog: (props: ConfirmDialogProps) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmProps, setConfirmProps] = useState<ConfirmDialogProps>({
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const openModal = (type: ModalType, data?: any) => {
    setModalType(type);
    setModalData(data);
  };

  const closeModal = () => {
    setModalType(null);
    setModalData(null);
  };

  const confirmDialog = (props: ConfirmDialogProps) => {
    setConfirmProps(props);
    setShowConfirmDialog(true);
  };

  const handleCloseConfirm = () => {
    setShowConfirmDialog(false);
  };

  return (
    <ModalContext.Provider value={{ modalType, modalData, openModal, closeModal, confirmDialog }}>
      {children}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCloseConfirm}
        onConfirm={confirmProps.onConfirm}
        title={confirmProps.title}
        description={confirmProps.description}
        confirmText={confirmProps.confirmText}
        cancelText={confirmProps.cancelText}
      />
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
