
import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { signIn, isLoading } = useAuth();
  const { t } = useLanguage();
  const form = useForm({
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onChange' // More responsive validation
  });
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [formSubmitted, setFormSubmitted] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const isMobile = useIsMobile();
  const [networkStatus, setNetworkStatus] = React.useState<'online' | 'offline'>('online');
  
  React.useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
      if (!navigator.onLine) {
        setAuthError(t(
          "You appear to be offline. Please check your internet connection.",
          "您似乎处于离线状态。请检查您的互联网连接。"
        ));
      } else if (authError?.includes("offline")) {
        setAuthError(null);
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus(); // Initial check
    
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, [authError, t]);

  const onSubmit = async (data: any) => {
    try {
      setFormSubmitted(true);
      setAuthError(null);
      
      // Check if we're online
      if (!navigator.onLine) {
        setAuthError(t(
          "You appear to be offline. Please check your internet connection.",
          "您似乎处于离线状态。请检查您的互联网连接。"
        ));
        setFormSubmitted(false);
        return;
      }

      // Try to ping supabase before attempting login
      try {
        const pingStart = Date.now();
        // Use a simple query instead of RPC since ping_db isn't in the TypeScript types yet
        const { data: pingData, error: pingError } = await supabase
          .from('profiles')
          .select('count(*)', { count: 'exact', head: true });
        
        const pingTime = Date.now() - pingStart;
        
        if (pingError && pingTime < 500) {
          console.warn("Supabase connection issue detected, but continuing with login attempt");
        }
      } catch (pingError) {
        console.warn("Supabase ping failed, but will attempt login anyway:", pingError);
      }
      
      // Proceed with login
      await signIn(data.email, data.password);
      
      // Check if we have a user after sign-in attempt (handled in AuthContext)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Use callback for guaranteed execution
        window.requestAnimationFrame(() => {
          onSuccess();
          navigate('/photo-points', { replace: true });
        });
      } else {
        throw new Error("Login failed. User not found after sign in.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      // Handle network and connection errors more gracefully on mobile
      if (!navigator.onLine || error.message === 'Failed to fetch' || error.message?.includes('fetch')) {
        setAuthError(t(
          "Network connection issue. Please check your internet connection and try again.",
          "网络连接问题。请检查您的互联网连接，然后重试。"
        ));
      } else if (error.message?.includes("Invalid login")) {
        setAuthError(t(
          "Incorrect email or password. Please try again.",
          "邮箱或密码不正确，请重试。"
        ));
      } else if (error.message?.includes("Email not confirmed")) {
        setAuthError(t(
          "Please verify your email address before signing in.",
          "请在登录前验证您的电子邮件地址。"
        ));
      } else if (error.message?.includes("Too many requests")) {
        setAuthError(t(
          "Too many login attempts. Please try again in a few minutes.",
          "登录尝试次数过多，请稍后再试。"
        ));
      } else if (!error.message?.includes("Email not confirmed") && 
                !error.message?.includes("Invalid login")) {
        setAuthError(t(
          "Something went wrong. Please try again.",
          "出现错误，请重试。"
        ));
      }
    } finally {
      setFormSubmitted(false);
    }
  };

  // Combined loading state
  const processing = isLoading || formSubmitted;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          rules={{
            required: t("Email is required", "必须填写邮箱"),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t("Please enter a valid email", "请输入有效的邮箱"),
            },
          }}
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <FormControl>
                  <Input 
                    {...field} 
                    id="login_email"
                    type="email" 
                    autoComplete="email"
                    placeholder={t("Your email address", "您的邮箱")}
                    className="pl-10 h-11 text-base"
                    disabled={processing}
                  />
                </FormControl>
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              </div>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          rules={{
            required: t("Password is required", "必须填写密码"),
          }}
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <FormControl>
                  <Input 
                    {...field} 
                    type={showPassword ? "text" : "password"}
                    id="login_password"
                    autoComplete="current-password"
                    placeholder={t("Your password", "您的密码")}
                    className="pl-10 pr-10 h-11 text-base"
                    disabled={processing}
                  />
                </FormControl>
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={processing}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {authError && (
          <div className="p-3 text-sm rounded-md bg-red-500/10 border border-red-500/20 text-red-500 flex items-start">
            {networkStatus === 'offline' && <WifiOff className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />}
            <span>{authError}</span>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90"
          disabled={processing || networkStatus === 'offline'}
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("Signing in...", "登录中...")}
            </>
          ) : (
            t("Sign In", "登录")
          )}
        </Button>
      </form>
    </Form>
  );
};

export default React.memo(LoginForm);
