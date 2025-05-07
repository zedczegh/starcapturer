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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { t } = useLanguage ? useLanguage() : { t: (en: string, zh: string) => en };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            const username = session.user.email?.split('@')[0] || 'stargazer';
            toast.success(`Welcome, ${username}! 🌟`, {
              description: "Ready for some stargazing? Your sky awaits!",
              duration: 4000,
              position: "top-center"
            });
          }, 0);
        }
      }
    );

    (async () => {
      const sessionResult = await supabase.auth.getSession();
      setSession(sessionResult.data.session);
      setUser(sessionResult.data.session?.user ?? null);
      setIsLoading(false);
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

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo + '/photo-points'
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
    let signedIn = false;
    try {
      toast("Signing in...", {
        description: "Checking your credentials...",
        position: "top-center",
        duration: 1500
      });

      const { error } = await supabase.auth.signInWithPassword({ 
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
        toast.error("Sign in paused", {
          description: errorMessage,
          position: "top-center"
        });
        return;
      }

      signedIn = true;
    } catch (error: any) {
      toast.error("Sign in error", {
        description: "An unknown error occurred. Please try again.",
        position: "top-center"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    let toastId: string | number | undefined = undefined;
    try {
      toastId = toast("Signing out...", {
        position: "top-center",
        duration: 1000
      });
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setSession(null);

      if (error) throw error;

      toast.success("See you soon! ✨", {
        description: "The stars will be waiting for your return",
        position: "top-center"
      });
    } catch (error: any) {
      toast.error("Sign out issue", {
        description: "Please try again in a moment",
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
