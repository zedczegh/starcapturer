
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

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      await signUp(data.email, data.password);
      onSuccess();
      navigate('/photo-points');
      toast.success(
        t(
          "Welcome! Please check your email to confirm your account.", 
          "欢迎！请检查您的邮箱以确认您的帐户。"
        )
      );
    } catch (error: any) {
      if (error?.message?.includes("already registered")) {
        toast.error(t("Email already registered", "该邮箱已被注册"));
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error(t("Sign up failed", "注册失败"));
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
              <label htmlFor="signup_email" className="block text-sm font-medium mb-1 text-foreground">
                {t("Email", "电子邮箱")}
              </label>
              <div className="relative">
                <FormControl>
                  <Input 
                    {...field} 
                    id="signup_email"
                    type="email" 
                    autoComplete="email"
                    placeholder={t("name@email.com", "邮箱")}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </FormControl>
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
              <FormMessage />
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
              <label htmlFor="signup_password" className="block text-sm font-medium mb-1 text-foreground">
                {t("Password", "密码")}
              </label>
              <div className="relative">
                <FormControl>
                  <Input 
                    {...field} 
                    id="signup_password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={t("Create a password", "创建密码")}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                </FormControl>
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                  aria-label={showPassword ? t("Hide password", "隐藏密码") : t("Show password", "显示密码")}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full animate-fade-in"
          disabled={isLoading}
        >
          {isLoading ? t("Creating account...", "创建帐户中...") : t("Create Account", "创建帐户")}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;
