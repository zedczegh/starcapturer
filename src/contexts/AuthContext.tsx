
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (username: string, password: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { t } = useLanguage ? useLanguage() : { t: (en: string, zh: string) => en };

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

  const signUp = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      console.log("Attempting to sign up with username:", username);
      
      // Check if username is available
      const { data: usernameCheck, error: usernameError } = await supabase.rpc('is_username_available', {
        username_to_check: username
      });
      
      if (usernameError) {
        console.error("Username check error:", usernameError);
        throw new Error(t(
          "Could not verify username availability. Please try again.",
          "无法验证用户名可用性。请重试。"
        ));
      }
      
      if (usernameCheck === false) {
        throw new Error(t(
          "This username is already taken. Please choose another one.",
          "此用户名已被使用。请选择另一个。"
        ));
      }

      // Use phone auth instead of email - this bypasses email provider restrictions
      // Format: +{username} as phone number
      const phoneNumber = `+${username}`;
      
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
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: username
          });
          
        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Continue anyway as the auth was successful
        }
      }

      toast.success(
        t(
          "Account created successfully!",
          "账户创建成功！"
        ),
        {
          duration: 4000,
          description: t(
            "Welcome to AstroSIQS! You are now logged in.",
            "欢迎来到AstroSIQS！您现在已登录。"
          ),
          position: "top-center"
        }
      );
      
    } catch (error: any) {
      console.error("Error during signup:", error);
      let errorMessage = error.message;
      
      toast.error(
        t(
          "Account creation issue",
          "帐户创建问题"
        ),
        {
          description: errorMessage ||
            t("Please try again with a different username", "请更换用户名后重试"),
          position: "top-center"
        }
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
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
        toast.error(t("Sign in failed", "登录失败"), {
          description: t("Username not found", "找不到用户名"),
          position: "top-center"
        });
        return;
      }
      
      console.log("Found profile:", profileData);
      
      // Sign in with phone number format
      const phoneNumber = `+${username}`;
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
        
        toast.error(t("Sign in failed", "登录失败"), {
          description: t(errorMessage, "请检查您的用户名和密码"),
          position: "top-center"
        });
      } else {
        console.log("Login successful!");
        toast.success(t("Signed in successfully!", "登录成功！"), {
          position: "top-center"
        });
      }
    } catch (error: any) {
      console.error("Unexpected error during sign in:", error);
      toast.error(t("Sign in error", "登录错误"), {
        description: t("An unexpected error occurred. Please try again.", "发生未知错误，请重试。"),
        position: "top-center"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setSession(null);

      if (error) throw error;
    } catch (error: any) {
      toast.error(t("Sign out issue", "登出问题"), {
        description: t("Please try again in a moment", "请稍后重试"),
        position: "top-center"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, isLoading }}>
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
