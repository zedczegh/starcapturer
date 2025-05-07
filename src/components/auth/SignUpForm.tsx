
import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
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

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      await signUp(data.username, data.password);
      onSuccess();
      navigate('/photo-points');
    } catch (error: any) {
      toast.error(
        t("Account creation issue", "账户创建问题"),
        {
          description: error.message || t("Please try again", "请重试"),
          position: "top-center"
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          rules={{
            required: t("Username is required", "必须填写用户名"),
            minLength: {
              value: 3,
              message: t("Username must be at least 3 characters", "用户名至少3位"),
            },
            pattern: {
              value: /^[a-zA-Z0-9_]+$/,
              message: t("Username can only contain letters, numbers, and underscores", "用户名只能包含字母、数字和下划线"),
            }
          }}
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <FormControl>
                  <Input 
                    {...field} 
                    id="signup_username"
                    type="text" 
                    autoComplete="username"
                    placeholder={t("Choose a username", "选择用户名")}
                    className="pl-10 h-11 text-base"
                    disabled={isLoading}
                  />
                </FormControl>
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
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
