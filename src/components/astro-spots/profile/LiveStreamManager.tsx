import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Video, Loader2, X, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LiveStreamManagerProps {
  spotId: string;
  currentStreamUrl: string | null;
  onUpdate: () => void;
}

const LiveStreamManager: React.FC<LiveStreamManagerProps> = ({ 
  spotId, 
  currentStreamUrl,
  onUpdate 
}) => {
  const { t } = useLanguage();
  const [streamUrl, setStreamUrl] = useState(currentStreamUrl || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_astro_spots')
        .update({ camera_stream_url: streamUrl || null })
        .eq('id', spotId);

      if (error) throw error;

      toast.success(t('Camera stream URL updated successfully', '摄像头直播链接更新成功'));
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating stream URL:', error);
      toast.error(t('Failed to update camera stream URL', '更新摄像头直播链接失败'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_astro_spots')
        .update({ camera_stream_url: null })
        .eq('id', spotId);

      if (error) throw error;

      setStreamUrl('');
      toast.success(t('Camera stream removed', '摄像头直播已移除'));
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error removing stream URL:', error);
      toast.error(t('Failed to remove camera stream', '移除摄像头直播失败'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-cosmic-800/30 border-cosmic-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cosmic-100">
          <Video className="h-5 w-5 text-primary" />
          {t('Live Camera Stream', '实时摄像头直播')}
        </CardTitle>
        <CardDescription className="text-cosmic-400">
          {t(
            'Share a live camera feed of your location. Supports YouTube Live, Twitch, or direct stream URLs.',
            '分享您地点的实时摄像头画面。支持 YouTube Live、Twitch 或直接流媒体链接。'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEditing ? (
          <div className="space-y-3">
            {currentStreamUrl ? (
              <div className="p-3 bg-cosmic-900/50 rounded-lg border border-cosmic-700/30">
                <p className="text-xs text-cosmic-400 mb-1">
                  {t('Current stream URL:', '当前直播链接：')}
                </p>
                <p className="text-sm text-cosmic-200 break-all font-mono">
                  {currentStreamUrl}
                </p>
              </div>
            ) : (
              <p className="text-sm text-cosmic-400 italic">
                {t('No camera stream configured', '未配置摄像头直播')}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {currentStreamUrl 
                  ? t('Edit Stream URL', '编辑直播链接')
                  : t('Add Stream URL', '添加直播链接')}
              </Button>
              {currentStreamUrl && (
                <Button
                  onClick={handleRemove}
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="streamUrl" className="text-cosmic-200">
                {t('Stream URL', '直播链接')}
              </Label>
              <Input
                id="streamUrl"
                type="url"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://youtube.com/embed/... or https://player.twitch.tv/..."
                className="bg-cosmic-900/50 border-cosmic-700/50 text-cosmic-100"
              />
              <p className="text-xs text-cosmic-500">
                {t(
                  'Enter a YouTube embed URL, Twitch player URL, or direct stream URL',
                  '输入 YouTube 嵌入链接、Twitch 播放器链接或直接流媒体链接'
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving || !streamUrl.trim()}
                size="sm"
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('Saving...', '保存中...')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('Save', '保存')}
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setStreamUrl(currentStreamUrl || '');
                }}
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                {t('Cancel', '取消')}
              </Button>
            </div>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-cosmic-900/30 rounded-lg border border-cosmic-700/30">
          <p className="text-xs font-medium text-cosmic-300 mb-2">
            {t('Supported formats:', '支持的格式：')}
          </p>
          <ul className="text-xs text-cosmic-400 space-y-1">
            <li>• YouTube: https://youtube.com/embed/VIDEO_ID</li>
            <li>• Twitch: https://player.twitch.tv/?channel=CHANNEL_NAME</li>
            <li>• {t('Direct stream URLs (HLS, RTMP)', '直接流媒体链接 (HLS, RTMP)')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveStreamManager;
