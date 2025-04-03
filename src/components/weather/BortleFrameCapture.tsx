
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Camera, AlertCircle, Moon, Sun } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { countStarsInImage, calculateBortleFromStars } from '@/utils/starCountUtils';

interface BortleFrameCaptureProps {
  onCaptureComplete: (bortleScale: number, starCount: number) => void;
  onCancel: () => void;
}

const BortleFrameCapture: React.FC<BortleFrameCaptureProps> = ({ 
  onCaptureComplete, 
  onCancel 
}) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureStage, setCaptureStage] = useState<'ready' | 'countdown' | 'capturing' | 'processing' | 'complete'>('ready');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isDarkFrameMode, setIsDarkFrameMode] = useState<boolean>(false);
  
  // Initialize video stream
  useEffect(() => {
    if (captureStage === 'ready') {
      initializeCamera();
    }
    
    return () => {
      // Clean up video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [captureStage]);
  
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(t(
        "Camera access was denied. Please allow camera access to measure light pollution.",
        "相机访问被拒绝。请允许相机访问以测量光污染。"
      ));
    }
  };
  
  // Handle countdown
  useEffect(() => {
    let timer: number;
    
    if (isCounting && countdown > 0) {
      timer = window.setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isCounting && countdown === 0) {
      // Transition to capturing stage
      setIsCounting(false);
      setCaptureStage('capturing');
      captureFrame();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isCounting, countdown]);
  
  // Handle capture progress animation
  useEffect(() => {
    let progressTimer: number;
    
    if (captureStage === 'capturing') {
      // Start at 0%
      setProgress(0);
      
      // Animate to 90% over 2.5 seconds to show activity
      const interval = 50; // Update every 50ms
      const duration = isDarkFrameMode ? 2500 : 2000; // 2.5s for dark frame, 2s for normal
      const steps = duration / interval;
      const increment = 90 / steps; // Go to 90% during simulation
      let currentProgress = 0;
      
      progressTimer = window.setInterval(() => {
        currentProgress += increment;
        if (currentProgress >= 90) {
          clearInterval(progressTimer);
          
          // Add a small delay at 90% to make the process feel more realistic
          setTimeout(() => {
            setProgress(100); // Jump to 100%
            
            // Add a small delay at 100% before proceeding
            setTimeout(() => {
              if (isDarkFrameMode) {
                processDarkFrame();
              } else {
                setCaptureStage('processing');
                processFrame();
              }
            }, 300);
          }, 300);
        } else {
          setProgress(currentProgress);
        }
      }, interval);
    }
    
    return () => {
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [captureStage, isDarkFrameMode]);
  
  // Start countdown
  const startCapture = () => {
    setCountdown(3);
    setIsCounting(true);
    setCaptureStage('countdown');
  };
  
  // Capture frame from video
  const captureFrame = () => {
    setIsCapturing(true);
  };
  
  // Process the normal frame (star detection)
  const processFrame = () => {
    setTimeout(() => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      // Match canvas to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data for analysis
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Count stars and calculate Bortle scale
      const starCount = countStarsInImage(imageData);
      const avgBrightness = calculateAverageBrightness(imageData.data);
      const bortleScale = calculateBortleFromStars(starCount, avgBrightness);
      
      console.log(`Processed frame: detected ${starCount} stars, brightness: ${avgBrightness}, estimated Bortle: ${bortleScale}`);
      
      // Cleanup and complete
      setCaptureStage('complete');
      setIsCapturing(false);
      
      // Pass results back to parent
      onCaptureComplete(bortleScale, starCount);
    }, 500); // Small delay for processing animation
  };
  
  // Process the dark frame (with phone covered/pointed down)
  const processDarkFrame = () => {
    // Move to regular frame capture after dark frame
    setIsDarkFrameMode(false);
    setCaptureStage('ready');
    
    // Wait a bit before showing instructions for next step
    setTimeout(() => {
      toast.info(
        t(
          "Now point your camera at the night sky to measure star visibility",
          "现在将相机对准夜空以测量星星的可见性"
        )
      );
      setCountdown(3);
      setProgress(0);
      
      // Start next capture after a short delay
      setTimeout(() => {
        startCapture();
      }, 1500);
    }, 500);
  };
  
  // Calculate average brightness from image data
  const calculateAverageBrightness = (data: Uint8ClampedArray): number => {
    let totalBrightness = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Use luminance formula to calculate brightness
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      totalBrightness += brightness;
    }
    
    return totalBrightness / (data.length / 4);
  };
  
  // Start dark frame capture
  const startDarkFrameCapture = () => {
    setIsDarkFrameMode(true);
    setCountdown(3);
    setIsCounting(true);
    setCaptureStage('countdown');
  };
  
  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden border-cosmic-600 bg-cosmic-900/90 backdrop-blur-sm">
      <CardContent className="p-0 relative">
        {/* Camera view or instructions */}
        <div className="aspect-video bg-black relative overflow-hidden rounded-t-lg">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
              <p className="text-white">{error}</p>
            </div>
          ) : captureStage === 'ready' && !isDarkFrameMode ? (
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
                onClick={startDarkFrameCapture}
                className="bg-cosmic-600 hover:bg-cosmic-500"
              >
                <Moon className="w-4 h-4 mr-2" />
                {t("Start Dark Frame", "开始暗帧")}
              </Button>
            </div>
          ) : isDarkFrameMode && captureStage === 'countdown' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cosmic-950/80 z-10">
              <Moon className="w-12 h-12 text-cosmic-300 mb-2" />
              <h3 className="text-2xl font-bold text-white">{countdown}</h3>
              <p className="text-cosmic-100 mt-2">
                {t("Cover camera lens", "遮住相机镜头")}
              </p>
            </div>
          ) : !isDarkFrameMode && captureStage === 'countdown' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cosmic-950/80 z-10">
              <Sun className="w-12 h-12 text-cosmic-300 mb-2" />
              <h3 className="text-2xl font-bold text-white">{countdown}</h3>
              <p className="text-cosmic-100 mt-2">
                {t("Point at the sky", "对准天空")}
              </p>
            </div>
          ) : null}
          
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
        {(captureStage === 'capturing' || captureStage === 'processing') && (
          <div className="p-4 bg-cosmic-900 text-white">
            <div className="flex justify-between mb-2">
              <span>
                {isDarkFrameMode 
                  ? t("Capturing dark frame...", "正在捕获暗帧...") 
                  : captureStage === 'processing'
                    ? t("Processing image...", "正在处理图像...")
                    : t("Capturing frame...", "正在捕获帧...")}
              </span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-cosmic-700" />
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
