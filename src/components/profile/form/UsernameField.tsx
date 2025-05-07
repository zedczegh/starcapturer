
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { z } from 'zod';

// Update the type definition to make username optional
export type ProfileFormValues = {
  username: string;
};

interface UsernameFieldProps {
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  defaultValue?: string;
}

const UsernameField: React.FC<UsernameFieldProps> = ({ register, errors, defaultValue = '' }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <Label htmlFor="username" className="text-cosmic-300">
        {t('Username', '用户名')}
      </Label>
      <Input
        id="username"
        {...register('username')}
        className="bg-cosmic-900/50 border-cosmic-700/50"
        placeholder={t('Enter your username', '输入您的用户名')}
        defaultValue={defaultValue}
      />
      {errors.username && (
        <p className="text-sm text-red-500">
          {errors.username.message}
        </p>
      )}
    </div>
  );
};

export default UsernameField;
