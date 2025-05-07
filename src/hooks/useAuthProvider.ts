
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumber, checkUsernameAvailability, showAuthToast, createUserProfile } from '@/utils/authUtils';

interface AuthHookReturn {
  user: User | null;
  session: Session | null;
  signUp: (username: string, password: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
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
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // THEN check for existing session
    const getInitialSession = async () => {
      try {
        const sessionResult = await supabase.auth.getSession();
        setSession(sessionResult.data.session);
        setUser(sessionResult.data.session?.user ?? null);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      console.log("Attempting to sign up with username:", username);
      
      // Check if username is available
      await checkUsernameAvailability(username, t);

      // Use phone auth instead of email - this bypasses email provider restrictions
      const phoneNumber = formatPhoneNumber(username);
      
      console.log("Using phone auth with number:", phoneNumber);
      
      // Sign up with phone
      const { data, error } = await supabase.auth.signUp({
        phone: phoneNumber,
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
        await createUserProfile(data.user.id, username);
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
        error.message || t("Please try again with a different username", "请更换用户名后重试")
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const signIn = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Attempting to sign in with username:", username);
      
      // Find the user by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        console.error("Profile lookup error:", profileError);
        showAuthToast(
          'error', 
          t("Sign in failed", "登录失败"),
          t("Username not found", "找不到用户名")
        );
        return;
      }
      
      console.log("Found profile:", profileData);
      
      // Sign in with phone number format
      const phoneNumber = formatPhoneNumber(username);
      console.log("Trying to sign in with phone:", phoneNumber);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        phone: phoneNumber, 
        password
      });
      
      if (error) {
        console.error("Login error:", error);
        let errorMessage = "Please check your username and password";
        if (error.message.includes("Invalid login")) {
          errorMessage = "Invalid password for this username";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Too many login attempts. Please try again in a few minutes";
        }
        
        showAuthToast(
          'error',
          t("Sign in failed", "登录失败"),
          t(errorMessage, "请检查您的用户名和密码")
        );
      } else {
        console.log("Login successful!");
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
