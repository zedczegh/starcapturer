import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  username: z.string().max(50).optional(),
});

interface AddAccountDialogProps {
  onAccountCreated: () => void;
}

const AddAccountDialog: React.FC<AddAccountDialogProps> = ({ onAccountCreated }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const validation = createUserSchema.safeParse({ email, password, username: username || undefined });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach(err => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('Not authenticated', '未登录'));
        return;
      }

      const response = await supabase.functions.invoke('create-user', {
        body: { email, password, username: username || undefined },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(t('Account created successfully', '账户创建成功'));
      resetForm();
      setOpen(false);
      onAccountCreated();
    } catch (err: any) {
      console.error('Error creating account:', err);
      toast.error(err.message || t('Failed to create account', '创建账户失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-green-500/30 text-green-400 hover:bg-green-500/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('Add Account', '添加账户')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-cosmic-900 border-cosmic-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-cosmic-50">
            {t('Create New Account', '创建新账户')}
          </DialogTitle>
          <DialogDescription className="text-cosmic-400">
            {t('Create a new user account with email and password', '使用邮箱和密码创建新用户账户')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-cosmic-200">
                {t('Email', '邮箱')} *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-cosmic-800/50 border-cosmic-600 text-cosmic-100"
                disabled={loading}
                required
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-cosmic-200">
                {t('Password', '密码')} *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-cosmic-800/50 border-cosmic-600 text-cosmic-100 pr-10"
                  disabled={loading}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-cosmic-400 hover:text-cosmic-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-cosmic-200">
                {t('Username (optional)', '用户名（可选）')}
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('Enter username', '输入用户名')}
                className="bg-cosmic-800/50 border-cosmic-600 text-cosmic-100"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-cosmic-600 text-cosmic-200"
              disabled={loading}
            >
              {t('Cancel', '取消')}
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('Creating...', '创建中...')}
                </>
              ) : (
                t('Create Account', '创建账户')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountDialog;
