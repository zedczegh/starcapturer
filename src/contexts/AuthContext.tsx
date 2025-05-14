import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';
import { clearOptimizedStorage } from '@/utils/optimizedCache';

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
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          console.log('Auth state change:', event, 'user:', newSession.user.email);
        } else {
          setSession(null);
          setUser(null);
          console.log('Auth state change:', event, 'No user session');
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
          setSession(null);
          setUser(null);
          setIsLoading(false);
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
            // Handle refresh error by clearing state
            setSession(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // Reset auth state on error
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      subscription.unsubscribe();
    };
  }, [t]);

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
    try {
      console.log('Attempting sign in for:', email);
      
      // Clear any cached data that might cause issues
      clearOptimizedStorage();
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        
        let errorMessage = t(
          "Please double-check your email and password",
          "请检查您的邮箱和密码"
        );
        
        if (error.message.includes("Email not confirmed")) {
          // Attempt to resend confirmation email
          await supabase.auth.resend({
            type: 'signup',
            email: email,
          });
          errorMessage = t(
            "Check your inbox for the verification email we just sent!",
            "请查收您的邮箱中的验证邮件！"
          );
        } else if (error.message.includes("Invalid login")) {
          errorMessage = t(
            "Please double-check your email and password",
            "请检查您的邮箱和密码"
          );
        } else if (error.message.includes("Too many requests")) {
          errorMessage = t(
            "Too many login attempts. Please try again in a few minutes",
            "登录尝试次数过多，请稍后再试"
          );
        } else if (error.message === 'Failed to fetch' || !navigator.onLine) {
          errorMessage = t(
            "Network connection issue. Please check your internet connection and try again.",
            "网络连接问题。请检查您的互联网连接，然后重试。"
          );
        }
        
        toast.error(t("Sign in paused", "登录暂停"), {
          description: errorMessage,
          position: "top-center"
        });
        
        throw error;
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
    } catch (error: any) {
      console.error('Exception in signIn:', error);
      
      if (error.message === 'Failed to fetch' || !navigator.onLine) {
        toast.error(t("Network Connection Issue", "网络连接问题"), {
          description: t(
            "Unable to reach our servers. Please check your internet connection and try again.",
            "无法连接到我们的服务器。请检查您的互联网连接，然后重试。"
          ),
          position: "top-center"
        });
      } else if (!error.message.includes("Email not confirmed") && 
                !error.message.includes("Invalid login")) {
        toast.error(t("Sign in error", "登录错误"), {
          description: t(
            "An unknown error occurred. Please try again.",
            "发生未知错误，请重试。"
          ),
          position: "top-center"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      console.log('Signing out user');
      // First set user to null to prevent any authenticated API calls after sign out
      setUser(null);
      setSession(null);
      
      // Clear any cached data 
      clearOptimizedStorage();
      
      const { error } = await supabase.auth.signOut({
        scope: 'local'  // Only sign out from this device
      });

      if (error) {
        console.error('Sign out error:', error);
        // Don't throw error here - we already set user to null
      }

      console.log('Sign out successful');
      toast.success(t("See you soon! ✨", "期待您的归来！ ✨"), {
        description: t(
          "The stars will be waiting for your return",
          "繁星将等待您的归来"
        ),
        position: "top-center"
      });
    } catch (error: any) {
      console.error('Exception in signOut:', error);
      // Don't show error toast on signout
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
