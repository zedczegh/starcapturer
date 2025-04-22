
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface AuthRequiredProps {
  children: React.ReactNode;
}

const AuthRequired: React.FC<AuthRequiredProps> = ({ children }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) {
    toast.error(t("Please sign in to access this page", "请登录以访问此页面"));
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthRequired;
