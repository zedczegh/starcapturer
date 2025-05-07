
import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Loader2 } from '@/components/ui/loader';

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
      </form>
    </Form>
  );
};

export default SignUpForm;
