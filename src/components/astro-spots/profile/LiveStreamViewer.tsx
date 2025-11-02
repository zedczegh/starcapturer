import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface LiveStreamViewerProps {
  streamUrl: string;
  spotName: string;
}

const LiveStreamViewer: React.FC<LiveStreamViewerProps> = ({ streamUrl, spotName }) => {
  const { t } = useLanguage();

  // Check if it's a YouTube embed URL
  const isYouTube = streamUrl.includes('youtube.com/embed') || streamUrl.includes('youtu.be');
  
  // Check if it's a Twitch embed URL
  const isTwitch = streamUrl.includes('twitch.tv');

  // Convert regular YouTube URLs to embed format if needed
  const getEmbedUrl = () => {
    if (streamUrl.includes('youtube.com/watch')) {
      const videoId = new URL(streamUrl).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (streamUrl.includes('youtu.be/')) {
      const videoId = streamUrl.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return streamUrl;
  };

  const embedUrl = getEmbedUrl();

  // Determine if we can embed this URL
  const canEmbed = isYouTube || isTwitch || embedUrl.includes('embed') || embedUrl.includes('player');

  return (
    <Card className="bg-cosmic-800/30 border-cosmic-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-cosmic-100">
            <Video className="h-5 w-5 text-primary animate-pulse" />
            {t('Live Camera Feed', '实时摄像头画面')}
          </CardTitle>
          <a 
            href={streamUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-cosmic-400 hover:text-primary transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        {canEmbed ? (
          <div className="relative w-full pt-[56.25%] bg-cosmic-900/50 rounded-lg overflow-hidden">
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${spotName} - ${t('Live Camera Feed', '实时摄像头画面')}`}
            />
          </div>
        ) : (
          <div className="w-full py-12 bg-cosmic-900/50 rounded-lg border border-cosmic-700/30 flex flex-col items-center justify-center gap-4">
            <Video className="h-12 w-12 text-cosmic-600" />
            <p className="text-cosmic-400 text-sm text-center px-4">
              {t(
                'This stream format requires opening in a new window',
                '此直播格式需要在新窗口中打开'
              )}
            </p>
            <Button
              onClick={() => window.open(streamUrl, '_blank')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {t('Open Stream', '打开直播')}
            </Button>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-cosmic-400 font-medium">
              {t('LIVE', '直播中')}
            </span>
          </div>
          <span className="text-xs text-cosmic-500">•</span>
          <span className="text-xs text-cosmic-500">
            {spotName}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveStreamViewer;
