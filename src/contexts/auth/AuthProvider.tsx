
import React from 'react';
import AuthContext from './AuthContext';
import { useAuthProvider } from './useAuthProvider';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuthProvider();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
