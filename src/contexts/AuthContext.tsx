
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updatePassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const { toast: shadcnToast } = useToast();
  const { t } = useLanguage();

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setSession(session);
      setUser(session.user);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      if (data.user && !data.user.confirmed_at) {
        toast.success(
          t("Verification email sent!", "验证邮件已发送！"),
          {
            description: t(
              "Please check your inbox and spam folder. Click the verification link to complete your registration.",
              "请检查收件箱和垃圾邮件文件夹。点击验证链接完成注册。"
            ),
            duration: 8000,
          }
        );
      }
    } catch (error: any) {
      toast.error(
        t("Sign up failed", "注册失败"),
        {
          description: error.message
        }
      );
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      toast.success(
        t("Signed in successfully!", "登录成功！"),
        {
          description: t(
            "Welcome back to AstroSIQS!", 
            "欢迎回到 AstroSIQS！"
          )
        }
      );
    } catch (error: any) {
      if (error.message.includes("Email not confirmed")) {
        toast.error(
          t("Email not verified", "邮箱未验证"),
          {
            description: t(
              "Please check your email and click the verification link to complete registration.",
              "请检查您的邮箱并点击验证链接完成注册。"
            )
          }
        );
      } else {
        toast.error(
          t("Sign in failed", "登录失败"),
          {
            description: error.message
          }
        );
      }
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success(t("Signed out successfully", "登出成功"));
    } catch (error: any) {
      toast.error(t("Sign out failed", "登出失败"), {
        description: error.message
      });
    }
  };

  const updatePassword = async (password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success(t("Password updated successfully", "密码更新成功"));
      return true;
    } catch (error: any) {
      toast.error(t("Failed to update password", "更新密码失败"), {
        description: error.message
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      signUp, 
      signIn, 
      signOut, 
      refreshProfile,
      updatePassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
