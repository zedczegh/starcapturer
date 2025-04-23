
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
      <DialogContent className="animate-in fade-in-0 slide-in-from-bottom-5 sm:zoom-in-90 sm:slide-in-from-bottom-0 fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center space-x-2">
            <MoonStar className="h-10 w-10 text-primary animate-pulse" />
            <span className="text-2xl font-bold tracking-tight">
              Astro<span className="text-primary">SIQS</span>
            </span>
          </div>
          <DialogTitle className="text-xl">
            {t("Join the Stargazing Community", "加入观星社区")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t(
              "Sign up to save your favorite observation spots, share your experiences, and connect with fellow stargazers.",
              "注册以保存您喜爱的观星地点，分享您的经验，并与其他观星者交流。"
            )}
          </p>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login" className="text-sm">
              {t("Sign In", "登录")}
            </TabsTrigger>
            <TabsTrigger value="signup" className="text-sm">
              {t("Create Account", "创建帐户")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-0">
            <LoginForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="signup" className="mt-0">
            <SignUpForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
