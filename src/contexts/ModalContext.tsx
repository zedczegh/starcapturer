
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalButton {
  label: string;
  action?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

interface ModalOptions {
  title: string;
  description: string;
  buttons: {
    confirm: ModalButton;
    cancel?: ModalButton;
  };
}

interface ModalContextType {
  isOpen: boolean;
  modalOptions: ModalOptions | null;
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);

  const openModal = (options: ModalOptions) => {
    setModalOptions(options);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setModalOptions(null), 300);
  };

  return (
    <ModalContext.Provider value={{ isOpen, modalOptions, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
