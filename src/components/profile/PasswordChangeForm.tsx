
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Key } from 'lucide-react';

const PasswordChangeForm = () => {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error(t("Password must be at least 6 characters", "密码长度至少为6位"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("Passwords do not match", "两次输入的密码不一致"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(t("Password update failed", "修改密码失败"), { description: error.message });
    } else {
      toast.success(t("Password updated successfully", "密码修改成功"));
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handlePasswordChange} className="space-y-4">
      <label className="block text-white font-medium mb-1">{t("New Password", "新密码")}</label>
      <div className="relative flex items-center">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-400 pointer-events-none">
          <Key className="w-5 h-5" />
        </span>
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder={t("Enter new password", "输入新密码")}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          minLength={6}
          disabled={loading}
          className="pl-12 pr-12 bg-cosmic-800 border-cosmic-700 text-white focus:border-primary"
        />
        <Button
          variant="ghost"
          type="button"
          className="absolute right-1 top-1 h-8 w-8 p-0 flex items-center justify-center"
          onClick={() => setShowPassword(v => !v)}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      <div className="relative flex items-center">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-400 pointer-events-none">
          <Key className="w-5 h-5" />
        </span>
        <Input
          type={showConfirm ? 'text' : 'password'}
          placeholder={t("Confirm new password", "确认新密码")}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          minLength={6}
          disabled={loading}
          className="pl-12 pr-12 bg-cosmic-800 border-cosmic-700 text-white focus:border-primary"
        />
        <Button
          variant="ghost"
          type="button"
          className="absolute right-1 top-1 h-8 w-8 p-0 flex items-center justify-center"
          onClick={() => setShowConfirm(v => !v)}
          tabIndex={-1}
        >
          {showConfirm ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      <Button 
        type="submit"
        className="w-full bg-primary text-white"
        disabled={loading}
      >
        {loading ? t("Changing...", "修改中...") : t("Change Password", "修改密码")}
      </Button>
      <div className="text-xs text-cosmic-400 mt-2">
        {t("Your current password is not visible for security reasons.", "出于安全考虑，当前密码不可见。")}
      </div>
    </form>
  );
};

export default PasswordChangeForm;

