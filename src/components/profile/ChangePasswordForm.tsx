
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';

const ChangePasswordForm = () => {
  const { t } = useLanguage();
  const { updatePassword } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oldPassword) {
      toast.error(t("Current password is required", "需要当前密码"));
      return;
    }
    
    if (password.length < 6) {
      toast.error(t("Password is too short", "密码太短"));
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error(t("Passwords do not match", "密码不匹配"));
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await updatePassword(password);
      if (success) {
        setOldPassword('');
        setPassword('');
        setConfirmPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-cosmic-800/50 p-4 rounded-lg border border-cosmic-700/50">
      <h3 className="font-medium text-cosmic-100 mb-4">
        {t("Change Password", "更改密码")}
      </h3>
      
      <div>
        <Label htmlFor="oldPassword" className="text-white mb-2 block">
          {t("Current Password", "当前密码")}
        </Label>
        <div className="relative">
          <Input
            id="oldPassword"
            type={showPassword ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="pl-10 bg-cosmic-800 border-cosmic-700 text-white focus:border-primary pr-10"
            placeholder={t("Enter current password", "输入当前密码")}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-400">
            <Lock className="w-5 h-5" />
          </div>
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cosmic-400 hover:text-cosmic-200"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      <div>
        <Label htmlFor="password" className="text-white mb-2 block">
          {t("New Password", "新密码")}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 bg-cosmic-800 border-cosmic-700 text-white focus:border-primary pr-10"
            placeholder={t("Enter new password", "输入新密码")}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-400">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor="confirmPassword" className="text-white mb-2 block">
          {t("Confirm New Password", "确认新密码")}
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 bg-cosmic-800 border-cosmic-700 text-white focus:border-primary pr-10"
            placeholder={t("Confirm new password", "确认新密码")}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-400">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>
      
      <div>
        <Button 
          type="submit" 
          disabled={isLoading || !oldPassword || !password || !confirmPassword}
          className="w-full bg-gradient-to-r from-primary to-[#8A6FD6] hover:opacity-90 text-white"
        >
          {isLoading ? t("Updating...", "更新中...") : t("Update Password", "更新密码")}
        </Button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
