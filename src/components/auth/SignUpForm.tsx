
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
      if (error.message.includes("already registered")) {
        toast.error(t("Email already registered", "该邮箱已被注册"));
      } else {
        toast.error(error.message);
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
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <FormControl>
                  <Input 
                    {...field} 
                    type="email" 
                    placeholder={t("Email", "电子邮箱")}
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
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <FormControl>
                  <Input 
                    {...field} 
                    type={showPassword ? "text" : "password"}
                    placeholder={t("Password", "密码")}
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
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? t("Creating account...", "创建帐户中...") : t("Create Account", "创建帐户")}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;
