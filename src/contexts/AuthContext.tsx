
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
    // First set up the auth change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          setTimeout(() => {
            const username = newSession.user.email?.split('@')[0] || 'stargazer';
            toast.success(`Welcome, ${username}! 🌟`, {
              description: "Ready for some stargazing? Your sky awaits!",
              duration: 4000,
              position: "top-center"
            });
          }, 0);
        }
      }
    );

    // Then check for existing session
    (async () => {
      try {
        console.log('Checking for existing session...');
        const { data: sessionData, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          return;
        }
        
        setSession(sessionData.session);
        setUser(sessionData.session?.user ?? null);
        
        console.log('Session check complete:', 
          sessionData.session ? 'Active session found' : 'No active session');
        
        if (sessionData.session) {
          // Refresh the session to ensure tokens are valid
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.warn('Session refresh error:', refreshError);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Starting signup process for:', email);

      let redirectTo = window.location.origin;
      if (!redirectTo.startsWith('http')) {
        redirectTo = 'https://siqs.astroai.top';
      }

      console.log('Using redirect URL:', redirectTo + '/photo-points');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo + '/photo-points'
        }
      });

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }

      console.log('Signup successful, user data:', data);

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
      console.error('Exception in signUp:', error);
      
      if (error.message === 'Failed to fetch' || !navigator.onLine) {
        toast.error(
          t(
            "Network Connection Issue",
            "网络连接问题"
          ),
          {
            description: t(
              "Unable to reach our servers. Please check your internet connection and try again.",
              "无法连接到我们的服务器。请检查您的互联网连接，然后重试。"
            ),
            position: "top-center"
          }
        );
      } else {
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
      }
      
      throw error;
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

      console.log('Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        
        let errorMessage = "Please double-check your email and password";
        if (error.message.includes("Email not confirmed")) {
          // Attempt to resend confirmation email
          await supabase.auth.resend({
            type: 'signup',
            email: email,
          });
          errorMessage = "Check your inbox for the verification email we just sent!";
        } else if (error.message.includes("Invalid login")) {
          errorMessage = "Please double-check your email and password";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Too many login attempts. Please try again in a few minutes";
        } else if (error.message === 'Failed to fetch' || !navigator.onLine) {
          errorMessage = "Network connection issue. Please check your internet connection and try again.";
        }
        
        toast.error("Sign in paused", {
          description: errorMessage,
          position: "top-center"
        });
        return;
      }

      console.log('Sign in successful, user data:', data);
      
      // Ensure profile exists after successful login
      if (data.user) {
        setTimeout(async () => {
          try {
            // We use setTimeout to avoid deadlock with the auth state change handler
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const ensureProfile = (await import('@/utils/profile/profileCore')).ensureUserProfile;
              await ensureProfile(user.id);
            }
          } catch (error) {
            console.error('Error ensuring profile exists after login:', error);
          }
        }, 500);
      }
      
      signedIn = true;
    } catch (error: any) {
      console.error('Exception in signIn:', error);
      
      if (error.message === 'Failed to fetch' || !navigator.onLine) {
        toast.error("Network Connection Issue", {
          description: "Unable to reach our servers. Please check your internet connection and try again.",
          position: "top-center"
        });
      } else {
        toast.error("Sign in error", {
          description: "An unknown error occurred. Please try again.",
          position: "top-center"
        });
      }
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
      
      console.log('Signing out user');
      const { error } = await supabase.auth.signOut({
        scope: 'local'  // Only sign out from this device
      });
      
      setUser(null);
      setSession(null);

      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }

      console.log('Sign out successful');
      toast.success("See you soon! ✨", {
        description: "The stars will be waiting for your return",
        position: "top-center"
      });
    } catch (error: any) {
      console.error('Exception in signOut:', error);
      
      if (error.message === 'Failed to fetch' || !navigator.onLine) {
        toast.error("Network Connection Issue", {
          description: "Unable to complete sign out due to network issues. You may be offline.",
          position: "top-center"
        });
      } else {
        toast.error("Sign out issue", {
          description: "Please try again in a moment",
          position: "top-center"
        });
      }
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
