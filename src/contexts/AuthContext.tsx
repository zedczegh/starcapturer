
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
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
    // First set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        // Only update state with synchronous operations here
        // IMPORTANT: We're avoiding any async Supabase calls inside this callback to prevent deadlocks
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Then check for existing session
    (async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error.message);
          return;
        }
        
        console.log("Initial session check:", data.session?.user?.email);
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      let redirectTo = window.location.origin;
      if (!redirectTo.startsWith('http')) {
        redirectTo = 'https://siqs.astroai.top';
      }

      // Ensure the redirect URL ends with a path
      if (!redirectTo.endsWith('/photo-points')) {
        redirectTo = `${redirectTo}/photo-points`;
      }

      console.log("Sign up with redirect to:", redirectTo);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      if (error) throw error;

      if (data.user && !data.user.confirmed_at) {
        toast.success(
          t(
            "Almost there! ✨",
            "就差一步！✨"
          ),
          {
            duration: 8000,
            description: (
              <>
                {t(
                  "Check your email (inbox and spam)! Click the confirmation link to activate your account. You will be redirected back to our website to complete your signup.",
                  "请查收您的邮箱（包括垃圾箱）！点击确认链接激活账号，系统将自动将您带回本站继续完成注册。"
                )}
                <br />
                <span className="font-bold">
                  {t(
                    "If you are not redirected, return to the site and sign in.",
                    "若未自动跳转，请回到本站重新登录。"
                  )}
                </span>
              </>
            ),
            position: "top-center"
          }
        );
      }
    } catch (error: any) {
      toast.error(
        t(
          "Account creation paused",
          "帐户创建已暂停"
        ),
        {
          description: error.message ||
            t("Please try again with a different email", "请更换邮箱后重试"),
          position: "top-center"
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Attempting to sign in:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });

      if (error) {
        let errorMessage = "Please double-check your email and password";
        if (error.message.includes("Email not confirmed")) {
          await supabase.auth.resend({
            type: 'signup',
            email: email,
          });
          errorMessage = "Check your inbox for the verification email we just sent!";
        } else if (error.message.includes("Invalid login")) {
          errorMessage = "Please double-check your email and password";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Too many login attempts. Please try again in a few minutes";
        }
        toast.error(t("Sign in paused", "登录暂停"), {
          description: t(errorMessage, "请检查您的邮箱和密码"),
          position: "top-center"
        });
        console.error("Sign in error:", error.message);
      } else {
        console.log("Sign in successful");
      }
    } catch (error: any) {
      console.error("Unknown sign in error:", error);
      toast.error(t("Sign in error", "登录错误"), {
        description: t("An unknown error occurred. Please try again.", "发生未知错误，请重试。"),
        position: "top-center"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      console.log("Signing out");
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Explicitly reset state on sign out to ensure clean state
      setUser(null);
      setSession(null);
      
      console.log("Sign out successful");
    } catch (error: any) {
      console.error("Sign out error:", error);
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
