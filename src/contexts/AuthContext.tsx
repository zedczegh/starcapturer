
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
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Show welcome back toast when user logs in from another device/tab
        if (event === 'SIGNED_IN' && session?.user) {
          // Use setTimeout to avoid potential supabase auth deadlocks
          setTimeout(() => {
            toast.success(`Welcome back, ${session.user.email?.split('@')[0] || 'explorer'}!`, {
              description: "Ready to explore the stars?",
              duration: 3000,
              position: "top-center"
            });
          }, 0);
        }
      }
    );

    // THEN check for existing session
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
      
      // Show user confirmation message about email verification
      if (data.user && !data.user.confirmed_at) {
        toast.success("Verification email sent!", {
          duration: 6000,
          description: "Please check your inbox and confirm your email to start your stargazing journey.",
          position: "top-center"
        });
      }
    } catch (error: any) {
      toast.error("Couldn't create account", {
        description: error.message,
        position: "top-center"
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Success toast is shown by the onAuthStateChange listener
    } catch (error: any) {
      if (error.message.includes("Email not confirmed")) {
        toast.error("Please confirm your email before signing in", {
          description: "Check your inbox for the verification email.",
          position: "top-center"
        });
      } else {
        toast.error("Sign in failed", {
          description: error.message,
          position: "top-center"
        });
      }
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully", {
        description: "Come back soon for more stargazing!",
        position: "top-center"
      });
    } catch (error: any) {
      toast.error("Sign out failed", {
        description: error.message,
        position: "top-center"
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut }}>
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
