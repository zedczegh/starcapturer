
import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

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
  const formRef = useRef<HTMLFormElement>(null);

  // Optimize login by caching form values for quick reentry
  useEffect(() => {
    // Retrieve cached email if available
    const cachedEmail = localStorage.getItem('lastLoginEmail');
    if (cachedEmail) {
      form.setValue('email', cachedEmail);
    }
    
    // Focus on password field if email is already filled
    if (cachedEmail) {
      setTimeout(() => {
        const passwordField = document.getElementById('login_password');
        if (passwordField) passwordField.focus();
      }, 100);
    }
    
    return () => {
      // Clean up any login-related state
      setFormSubmitted(false);
    };
  }, [form]);

  const onSubmit = async (data: any) => {
    try {
      setFormSubmitted(true);
      
      // Cache email for future logins
      localStorage.setItem('lastLoginEmail', data.email);
      
      // Clear any existing errors
      toast.dismiss();
      
      // Add a minimal timeout to ensure UI feedback is visible
      const loginStart = Date.now();
      
      // Optimize login sequence
      const result = await signIn(data.email, data.password);
      
      const loginDuration = Date.now() - loginStart;
      
      // Show success toast only if login takes longer than 500ms
      if (loginDuration > 500) {
        toast.success(t("Login successful", "登录成功"));
      }
      
      // Use requestAnimationFrame for smoother transition
      requestAnimationFrame(() => {
        // Use a small delay to ensure the auth state is fully updated
        setTimeout(() => {
          onSuccess();
          navigate('/photo-points', { replace: true });
        }, 100);
      });
    } catch (error: any) {
      // Improved error handling
      console.error("Login error:", error);
      
      let errorMessage = t("Login failed", "登录失败");
      if (error?.message) {
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = t("Invalid email or password", "邮箱或密码错误");
        } else if (error.message.includes("rate limit")) {
          errorMessage = t("Too many login attempts, please try again later", "登录尝试次数过多，请稍后再试");
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setFormSubmitted(false);
    }
  };

  // Combined loading state
  const processing = isLoading || formSubmitted;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" ref={formRef}>
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

        <Button 
          type="submit" 
          className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90"
          disabled={processing}
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
