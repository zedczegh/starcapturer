import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShareCardGeneratorProps {
  postId: string;
  imageUrl: string;
  description: string | null;
  username: string;
}

export const ShareCardGenerator: React.FC<ShareCardGeneratorProps> = ({
  imageUrl,
  description,
  username,
}) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateShareCard = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 1080;
      canvas.height = 1350;

      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#1e293b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load and draw the post image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Calculate image dimensions to fit within canvas with padding
      const maxWidth = canvas.width - 80;
      const maxHeight = 900;
      let imgWidth = img.width;
      let imgHeight = img.height;
      const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
      imgWidth = imgWidth * ratio;
      imgHeight = imgHeight * ratio;

      const x = (canvas.width - imgWidth) / 2;
      const y = 40;

      // Draw rounded rectangle for image
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, imgWidth, imgHeight, 20);
      ctx.clip();
      ctx.drawImage(img, x, y, imgWidth, imgHeight);
      ctx.restore();

      // Draw border around image
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x, y, imgWidth, imgHeight, 20);
      ctx.stroke();

      // Draw bottom section
      const bottomY = y + imgHeight + 40;
      
      // Draw username
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`@${username}`, canvas.width / 2, bottomY);

      // Draw description if exists
      if (description) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        
        // Wrap text
        const maxLineWidth = canvas.width - 120;
        const words = description.split(' ');
        let line = '';
        let lineY = bottomY + 60;
        const lineHeight = 45;
        const maxLines = 3;
        let lineCount = 0;

        for (let i = 0; i < words.length && lineCount < maxLines; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxLineWidth && i > 0) {
            ctx.fillText(line, canvas.width / 2, lineY);
            line = words[i] + ' ';
            lineY += lineHeight;
            lineCount++;
          } else {
            line = testLine;
          }
        }
        
        if (lineCount < maxLines && line) {
          ctx.fillText(line, canvas.width / 2, lineY);
        }
      }

      // Draw watermark
      ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Created with SIQS', canvas.width / 2, canvas.height - 40);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${username}-post-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(t('Share card downloaded!', '分享卡片已下载！'));
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating share card:', error);
      toast.error(t('Failed to generate share card', '生成分享卡片失败'));
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={generateShareCard}
        className="gap-1 text-cosmic-300 hover:text-primary"
        title={t('Generate Share Card', '生成分享卡片')}
      >
        <Download className="h-4 w-4" />
        <span className="text-xs">{t('Share Card', '分享卡片')}</span>
      </Button>
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};
