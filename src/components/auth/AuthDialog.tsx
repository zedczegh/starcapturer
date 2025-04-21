
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { MoonStar } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 animate-scale-in overflow-hidden outline-none bg-background shadow-2xl border border-accent/60">
        <div className="space-y-8 p-6">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center space-x-2">
              <MoonStar className="h-8 w-8 text-primary animate-pulse" />
              <span className="text-xl font-bold tracking-tight">
                Astro<span className="text-primary">SIQS</span>
              </span>
            </div>
            <DialogTitle className="text-xl">
              {t("Sign in or create account", "登录或注册账户")}
            </DialogTitle>
            <div className="text-xs text-muted-foreground">
              {t("Unlock full access to your saved collections, profile, and more.", "登录以解锁收藏夹、个人资料等全部功能。")}
            </div>
          </DialogHeader>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">{t("Login", "登录")}</TabsTrigger>
              <TabsTrigger value="signup">{t("Sign Up", "注册")}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSuccess={() => onOpenChange(false)} />
            </TabsContent>
            <TabsContent value="signup">
              <SignUpForm onSuccess={() => onOpenChange(false)} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
