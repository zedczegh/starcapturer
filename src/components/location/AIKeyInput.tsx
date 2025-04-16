
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

export const useAIKey = () => {
  return localStorage.getItem('deepseek_api_key');
};

export const AIKeyInput = ({ onKeySet }: { onKeySet: () => void }) => {
  const [open, setOpen] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const { t } = useLanguage();

  const handleSave = () => {
    localStorage.setItem('deepseek_api_key', apiKey);
    setOpen(false);
    onKeySet();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Enter Deepseek API Key", "输入 Deepseek API 密钥")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            type="password"
          />
          <Button onClick={handleSave} className="w-full">
            {t("Save API Key", "保存 API 密钥")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
