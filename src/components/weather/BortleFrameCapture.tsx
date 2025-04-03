
import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Camera, AlertCircle, Moon, Sun } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import CaptureCountdown from './CaptureCountdown';
import CaptureProgress from './CaptureProgress';
import { AnimatePresence } from 'framer-motion';

interface BortleFrameCaptureProps {
  onCaptureComplete: (bortleScale: number, starCount: number) => void;
  onCancel: () => void;
}

const BortleFrameCapture: React.FC<BortleFrameCaptureProps> = ({ 
  onCaptureComplete, 
  onCancel 
}) => {
  const { t } = useLanguage();
  
  const {
    videoRef,
    canvasRef,
    countdown,
    progress,
    captureStage,
    error,
    captureMode,
    darkFrameCaptured,
    captureDone,
    beginCapture
  } = useCameraCapture({ onCaptureComplete });

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden border-cosmic-600 bg-cosmic-900/90 backdrop-blur-sm">
      <CardContent className="p-0 relative">
        {/* Camera view */}
        <div className="aspect-video bg-black relative overflow-hidden rounded-t-lg">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
              <p className="text-white">{error}</p>
            </div>
          ) : captureStage === 'ready' && !darkFrameCaptured ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cosmic-950/80 z-10 p-4 text-center">
              <Camera className="w-12 h-12 text-cosmic-300 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {t("Measure Light Pollution", "测量光污染")}
              </h3>
              <p className="text-cosmic-100 mb-6 max-w-xs">
                {t(
                  "First we'll take a dark reference frame. Cover your camera or point it down at a dark surface.",
                  "首先，我们将拍摄一个暗参考帧。遮住您的相机或将其朝下指向暗表面。"
                )}
              </p>
              <Button 
                onClick={() => beginCapture('dark')}
                className="bg-cosmic-600 hover:bg-cosmic-500"
              >
                <Moon className="w-4 h-4 mr-2" />
                {t("Start Dark Frame", "开始暗帧")}
              </Button>
            </div>
          ) : captureStage === 'ready' && darkFrameCaptured ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cosmic-950/80 z-10 p-4 text-center">
              <Sun className="w-12 h-12 text-cosmic-300 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {t("Ready for Sky Measurement", "准备测量天空")}
              </h3>
              <p className="text-cosmic-100 mb-6 max-w-xs">
                {t(
                  "Dark frame captured. Now point your camera at the night sky to measure star visibility.",
                  "暗帧已捕获。现在将相机对准夜空以测量星星的可见度。"
                )}
              </p>
              <Button 
                onClick={() => beginCapture('light')}
                className="bg-amber-600 hover:bg-amber-500"
              >
                <Sun className="w-4 h-4 mr-2" />
                {t("Measure Sky", "测量天空")}
              </Button>
            </div>
          ) : null}
          
          <AnimatePresence>
            {captureStage === 'countdown' && countdown !== null && (
              <CaptureCountdown 
                countdown={countdown} 
                mode={captureMode || 'dark'} 
              />
            )}
          </AnimatePresence>
          
          {/* Video element */}
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
          
          {/* Canvas for processing (hidden) */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        {/* Progress status */}
        {captureStage === 'capturing' && (
          <CaptureProgress 
            progress={progress} 
            mode={captureMode || 'dark'} 
            isComplete={captureDone}
          />
        )}
        
        {captureStage === 'processing' && (
          <div className="p-4 bg-cosmic-900 text-white">
            <div className="flex justify-between mb-2">
              <span>{t("Processing image...", "正在处理图像...")}</span>
              <span>100%</span>
            </div>
            <div className="h-2 bg-cosmic-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 rounded-full" 
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Cancel button */}
        {captureStage !== 'complete' && (
          <div className="p-4 bg-cosmic-900 border-t border-cosmic-700">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="w-full border-cosmic-600 text-cosmic-100 hover:bg-cosmic-800"
            >
              {t("Cancel", "取消")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BortleFrameCapture;
