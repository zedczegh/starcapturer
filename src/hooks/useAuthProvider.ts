
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { checkUsernameAvailability, showAuthToast, createUserProfile, ensureUserProfile } from '@/utils/authUtils';

interface AuthHookReturn {
  user: User | null;
  session: Session | null;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

export const useAuthProvider = (t: (en: string, zh: string) => string): AuthHookReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // If user signed in or session refreshed, ensure they have a profile
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          // Use setTimeout to avoid blocking auth state change
          setTimeout(async () => {
            await ensureUserProfile(session.user.id, session.user.email || '');
          }, 0);
        }
      }
    );

    // THEN check for existing session
    const getInitialSession = async () => {
      try {
        const sessionResult = await supabase.auth.getSession();
        setSession(sessionResult.data.session);
        setUser(sessionResult.data.session?.user ?? null);
        
        // Ensure profile exists for already logged in user
        if (sessionResult.data.session?.user) {
          const user = sessionResult.data.session.user;
          await ensureUserProfile(user.id, user.email || '');
        }
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      console.log("Attempting to sign up with username:", username, "and email:", email);
      
      // Check if username is available
      await checkUsernameAvailability(username, t);

      // Sign up with email
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          }
        }
      });

      if (error) {
        console.error("Signup error:", error);
        throw error;
      }

      // Create the profile entry for the new user
      if (data.user) {
        await createUserProfile(data.user.id, username, email);
      }

      showAuthToast(
        'success',
        t("Account created successfully!", "账户创建成功！"),
        t("Welcome to AstroSIQS! You are now logged in.", "欢迎来到AstroSIQS！您现在已登录。")
      );
      
    } catch (error: any) {
      console.error("Error during signup:", error);
      
      showAuthToast(
        'error',
        t("Account creation issue", "帐户创建问题"),
        error.message || t("Please try again with a different email", "请更换邮箱后重试")
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Attempting to sign in with email:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) {
        console.error("Login error:", error);
        let errorMessage = "Please check your email and password";
        if (error.message.includes("Invalid login")) {
          errorMessage = "Invalid password for this email";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Too many login attempts. Please try again in a few minutes";
        }
        
        showAuthToast(
          'error',
          t("Sign in failed", "登录失败"),
          t(errorMessage, "请检查您的邮箱和密码")
        );
      } else {
        console.log("Login successful!");
        
        // Ensure profile exists for user
        if (data.user) {
          await ensureUserProfile(data.user.id, data.user.email || '');
        }
        
        showAuthToast(
          'success',
          t("Signed in successfully!", "登录成功！")
        );
      }
    } catch (error: any) {
      console.error("Unexpected error during sign in:", error);
      showAuthToast(
        'error',
        t("Sign in error", "登录错误"),
        t("An unexpected error occurred. Please try again.", "发生未知错误，请重试。")
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setSession(null);

      if (error) throw error;
    } catch (error: any) {
      showAuthToast(
        'error',
        t("Sign out issue", "登出问题"),
        t("Please try again in a moment", "请稍后重试")
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  return {
    user,
    session,
    signUp,
    signIn,
    signOut,
    isLoading
  };
};
