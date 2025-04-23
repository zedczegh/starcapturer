
import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpFormProps {
  onSuccess: () => void;
}

const SignUpForm = ({ onSuccess }: SignUpFormProps) => {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const form = useForm<SignUpFormData>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const onSubmit = async (data: SignUpFormData) => {
    if (data.password !== data.confirmPassword) {
      form.setError('confirmPassword', {
        type: 'manual',
        message: t('Passwords do not match', '密码不匹配')
      });
      return;
    }

    try {
      setIsLoading(true);
      await signUp(data.email, data.password);
      onSuccess();
      navigate('/photo-points');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(t('Failed to create account', '创建账户失败'), {
        description: error.message || t('Please try again', '请重试'),
      });
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
            required: t('Email is required', '必须填写邮箱'),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t('Please enter a valid email', '请输入有效的邮箱'),
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
                    placeholder={t('name@email.com', '邮箱')}
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
            required: t('Password is required', '必须填写密码'),
            minLength: {
              value: 8,
              message: t('Password must be at least 8 characters', '密码至少8位'),
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
              message: t(
                'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                '密码必须包含至少一个大写字母、一个小写字母和一个数字'
              ),
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
                    placeholder={t('Create a strong password', '创建强密码')}
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

        <FormField
          control={form.control}
          name="confirmPassword"
          rules={{
            required: t('Please confirm your password', '请确认密码'),
            validate: (value) => 
              value === form.getValues('password') || 
              t('Passwords do not match', '密码不匹配')
          }}
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <FormControl>
                  <Input 
                    {...field}
                    id="signup_confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={t('Confirm your password', '确认密码')}
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
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
              {t('Creating Account...', '创建帐户中...')}
            </>
          ) : (
            t('Create Account', '创建帐户')
          )}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;
