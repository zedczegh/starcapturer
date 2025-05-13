
import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface SignUpFormProps {
  onSuccess: () => void;
}

const SignUpForm = ({ onSuccess }: SignUpFormProps) => {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const form = useForm();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [networkError, setNetworkError] = React.useState<string | null>(null);

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      setNetworkError(null);
      
      // Check network connectivity before attempting signup
      if (!navigator.onLine) {
        setNetworkError(t(
          "You appear to be offline. Please check your internet connection and try again.",
          "您似乎处于离线状态。请检查您的互联网连接，然后重试。"
        ));
        return;
      }
      
      // Attempt to ping the Supabase URL to see if it's reachable
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('https://fmnivvwpyriufxaebbzi.supabase.co/auth/v1/health', { 
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbml2dndweXJpdWZ4YWViYnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODU3NTAsImV4cCI6MjA2MDM2MTc1MH0.HZX_hS0A1nUB3iO7wDmTjMBoYk3hQz6lqmyBEYvoQ9Y'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn('Supabase health check failed:', response.status);
          setNetworkError(t(
            "Our authentication service is currently experiencing issues. Please try again later.",
            "我们的认证服务目前遇到问题。请稍后再试。"
          ));
          return;
        }
      } catch (error) {
        console.warn('Error checking Supabase reachability:', error);
        setNetworkError(t(
          "Unable to connect to our servers. This might be due to network issues or our servers may be experiencing problems.",
          "无法连接至我们的服务器。这可能是由于网络问题，或者我们的服务器可能遇到了问题。"
        ));
        return;
      }
      
      // Proceed with signup
      await signUp(data.email, data.password);
      onSuccess();
      navigate('/photo-points');
    } catch (error: any) {
      console.error('Sign up error:', error);
      if (error.message === 'Failed to fetch' || !navigator.onLine) {
        setNetworkError(t(
          "Network connection issue. Please check your internet connection and try again.",
          "网络连接问题。请检查您的互联网连接，然后重试。"
        ));
      } else if (error.message?.includes("User already registered")) {
        setNetworkError(t(
          "This email is already registered. Please try signing in instead.",
          "此邮箱已注册。请尝试登录。"
        ));
      } else {
        setNetworkError(error.message || t(
          "Error creating account. Please try again.",
          "创建账号时出错。请重试。"
        ));
      }
    } finally {
      setIsLoading(false);
    }
  };

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
                    id="signup_email"
                    type="email" 
                    autoComplete="email"
                    placeholder={t("name@email.com", "邮箱")}
                    className="pl-10 h-11 text-base"
                    disabled={isLoading}
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
            minLength: {
              value: 6,
              message: t("Password must be at least 6 characters", "密码至少6位"),
            }
          }}
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <FormControl>
                  <Input 
                    {...field} 
                    id="signup_password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={t("Create a strong password", "创建强密码")}
                    className="pl-10 pr-10 h-11 text-base"
                    disabled={isLoading}
                  />
                </FormControl>
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
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

        {networkError && (
          <div className="p-3 text-sm rounded-md bg-red-500/10 border border-red-500/20 text-red-500">
            <p>{networkError}</p>
            <p className="mt-1 text-xs opacity-80">
              {t("Tip: Make sure you're connected to the internet and the server is accessible.",
                "提示：确保您已连接到互联网，并且服务器可访问。")}
            </p>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("Creating Account...", "创建帐户中...")}
            </>
          ) : (
            t("Create Account", "创建帐户")
          )}
        </Button>

        <div className="text-xs text-cosmic-400 text-center">
          {t(
            "By signing up, you agree to our Terms and Privacy Policy",
            "注册即表示您同意我们的条款和隐私政策"
          )}
        </div>
      </form>
    </Form>
  );
};

export default SignUpForm;
