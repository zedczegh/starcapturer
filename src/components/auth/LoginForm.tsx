
import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AtSign, Lock, Loader2 } from 'lucide-react';

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { signIn, isLoading } = useAuth();
  const { t } = useLanguage();
  const form = useForm();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [formSubmitted, setFormSubmitted] = React.useState(false);

  const onSubmit = async (data: any) => {
    try {
      setFormSubmitted(true);
      await signIn(data.email, data.password);
      onSuccess();
      navigate('/photo-points');
      // Toast notification is handled in AuthContext
    } catch (error: any) {
      // Error handling is done in AuthContext
      console.error("Login error:", error);
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
            required: t("Email is required", "必须填写电子邮箱"),
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: t("Invalid email address", "电子邮箱格式无效"),
            }
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
                    placeholder={t("Your email address", "您的电子邮箱")}
                    className="pl-10 h-11 text-base"
                    disabled={processing}
                  />
                </FormControl>
                <AtSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
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

export default LoginForm;
