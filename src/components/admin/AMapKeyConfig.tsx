import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { Key, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AMapKeyConfig: React.FC = () => {
  const { t } = useLanguage();
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [keyPreview, setKeyPreview] = useState('');

  useEffect(() => {
    checkAMapKey();
  }, []);

  const checkAMapKey = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setIsLoading(false);
        return;
      }
      
      if (!session) {
        console.log('No active session found');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('get-amap-key', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data) {
        setHasKey(data.hasKey);
        if (data.key && data.hasKey) {
          const key = data.key;
          if (key.length > 12) {
            setKeyPreview(`${key.substring(0, 8)}...${key.substring(key.length - 4)}`);
          } else {
            setKeyPreview('***');
          }
        }
      }
    } catch (error) {
      console.error('Error checking AMap key:', error);
      toast.error(t('Failed to check AMap API key status', '无法检查高德地图API密钥状态'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateKey = () => {
    toast.info(
      t(
        'To update the AMap API key, please go to Settings → Secrets and update the AMAP_API_KEY value.',
        '要更新高德地图API密钥，请转到设置 → 密钥并更新AMAP_API_KEY值。'
      )
    );
  };

  return (
    <Card className="bg-cosmic-900/50 border-cosmic-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cosmic-50">
          <Key className="h-5 w-5" />
          {t('AMap API Key Configuration', '高德地图API密钥配置')}
        </CardTitle>
        <CardDescription className="text-cosmic-300">
          {t(
            'Configure your AMap API key to enable AMap functionality. The key is stored securely in Supabase secrets.',
            '配置您的高德地图API密钥以启用高德地图功能。密钥安全存储在Supabase密钥中。'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-cosmic-400 text-sm">
            {t('Loading...', '加载中...')}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="amap-key-preview" className="text-cosmic-200">
                {t('Current API Key Status', '当前API密钥状态')}
              </Label>
              <div className="flex items-center gap-2">
                {hasKey ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 text-sm">
                      {t('Configured', '已配置')}
                    </span>
                    {keyPreview && (
                      <code className="text-xs text-cosmic-400 bg-cosmic-800/50 px-2 py-1 rounded">
                        {keyPreview}
                      </code>
                    )}
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span className="text-amber-400 text-sm">
                      {t('Not Configured', '未配置')}
                    </span>
                  </>
                )}
              </div>
            </div>

            <Alert className="bg-cosmic-800/50 border-cosmic-600">
              <AlertDescription className="text-xs text-cosmic-300">
                {t(
                  'The AMap API key is stored as a Supabase secret (AMAP_API_KEY) and can only be updated through the Secrets management interface. This ensures maximum security.',
                  '高德地图API密钥存储为Supabase密钥（AMAP_API_KEY），只能通过密钥管理界面更新。这确保了最大的安全性。'
                )}
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUpdateKey}
                className="text-xs"
              >
                <Key className="h-3.5 w-3.5 mr-1.5" />
                {t('Update API Key', '更新API密钥')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://console.amap.com/dev/key/app', '_blank')}
                className="text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                {t('Get AMap Key', '获取高德密钥')}
              </Button>
            </div>

            <div className="text-xs text-cosmic-400 space-y-1 pt-2 border-t border-cosmic-700/30">
              <p className="font-medium text-cosmic-300">
                {t('How to get an AMap API Key:', '如何获取高德地图API密钥：')}
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>{t('Visit AMap Developer Console', '访问高德开发者控制台')}</li>
                <li>{t('Create or log in to your account', '创建或登录您的账户')}</li>
                <li>{t('Create a new application', '创建新应用')}</li>
                <li>{t('Generate a Web service API key', '生成Web服务API密钥')}</li>
                <li>{t('Copy the key and update it in Secrets', '复制密钥并在密钥中更新')}</li>
              </ol>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AMapKeyConfig;
