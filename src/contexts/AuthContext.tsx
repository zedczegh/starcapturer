
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

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

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Welcome back toast (use setTimeout for async UI update)
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

    // THEN check for existing session (optimized & async)
    (async () => {
      const sessionResult = await supabase.auth.getSession();
      setSession(sessionResult.data.session);
      setUser(sessionResult.data.session?.user ?? null);
      setIsLoading(false); // Only finish loading after check
    })();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;

      // Show user confirmation message about email verification
      if (data.user && !data.user.confirmed_at) {
        toast.success("Almost there! ✨", {
          duration: 6000,
          description: "Check your email to verify your account and start your cosmic journey!",
          position: "top-center"
        });
      }
    } catch (error: any) {
      toast.error("Account creation paused", {
        description: error.message || "Please try again with a different email",
        position: "top-center"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Immediately set loading then run async for fastest feedback
    setIsLoading(true);
    let signedIn = false;
    try {
      // Non-blocking flow, set toast first
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
        // Handle common errors quickly
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

      signedIn = true; // Successful sign in
      // Success toast is dispatched by the onAuthStateChange listener
    } catch (error: any) {
      toast.error("Sign in error", {
        description: "An unknown error occurred. Please try again.",
        position: "top-center"
      });
    } finally {
      setIsLoading(false);
      // If fast sign in, UI is unlocked as soon as possible
    }
  };

  const signOut = async () => {
    // Improve speed by showing feedback instantly
    setIsLoading(true); // Start loading
    let toastId: string | undefined = undefined; // Fixed type here - using string | undefined instead of string | number
    try {
      // Show instant feedback
      toastId = toast("Signing out...", {
        position: "top-center",
        duration: 1000
      }) as string; // Cast to string since toast() can return string
      
      // Run signout async, finish UI reset fast
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setSession(null);

      if (error) throw error;

      // Quick feedback after actual sign out
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
