
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { initializeCamera, stopMediaStream, captureVideoFrame, calculateAverageBrightness } from '@/utils/cameraUtils';
import { countStarsInImage, calculateBortleFromStars } from '@/utils/starCountUtils';

interface UseCameraCaptureProps {
  onCaptureComplete: (bortleScale: number, starCount: number) => void;
}

export const useCameraCapture = ({ onCaptureComplete }: UseCameraCaptureProps) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [captureStage, setCaptureStage] = useState<'ready' | 'countdown' | 'capturing' | 'processing' | 'complete'>('ready');
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureMode, setCaptureMode] = useState<'dark' | 'light' | null>(null);
  const [captureDone, setCaptureDone] = useState<boolean>(false);
  
  // Track if dark frame was captured successfully
  const [darkFrameCaptured, setDarkFrameCaptured] = useState<boolean>(false);

  // Initialize camera on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        if (captureStage === 'ready' && !stream) {
          const newStream = await initializeCamera();
          
          if (newStream) {
            setStream(newStream);
            
            if (videoRef.current) {
              videoRef.current.srcObject = newStream;
            }
          } else {
            setError(t(
              "Camera access was denied. Please allow camera access to measure light pollution.",
              "相机访问被拒绝。请允许相机访问以测量光污染。"
            ));
          }
        }
      } catch (err) {
        console.error("Camera initialization error:", err);
        setError(t(
          "Error initializing camera. Please try again.",
          "初始化相机时出错。请重试。"
        ));
      }
    };
    
    initCamera();
    
    // Cleanup on unmount
    return () => {
      stopMediaStream(stream);
      setStream(null);
    };
  }, [captureStage, t, stream]);

  // Handle countdown
  useEffect(() => {
    let timer: number;
    
    if (countdown !== null && countdown > 0) {
      timer = window.setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Transition to capturing state
      setCountdown(null);
      setCaptureStage('capturing');
      startCapture();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  // Handle capture progress animation
  useEffect(() => {
    let progressTimer: number | null = null;
    
    if (captureStage === 'capturing') {
      // Reset progress
      setProgress(0);
      setCaptureDone(false);
      
      // Animate progress over time
      const interval = 40; // Update every 40ms for smoother animation
      const duration = captureMode === 'dark' ? 2500 : 2200; // Slightly longer for dark frame
      const steps = duration / interval;
      const increment = 90 / steps; // Go to 90% during animation
      
      let currentProgress = 0;
      
      progressTimer = window.setInterval(() => {
        currentProgress += increment;
        
        if (currentProgress >= 90) {
          if (progressTimer) {
            clearInterval(progressTimer);
            progressTimer = null;
          }
          
          // Hold at 90% for a moment
          setTimeout(() => {
            // Jump to 100%
            setProgress(100);
            setCaptureDone(true);
            
            // Add a delay before proceeding to next stage
            setTimeout(() => {
              if (captureMode === 'dark') {
                completeDarkFrameCapture();
              } else {
                setCaptureStage('processing');
                processCapturedFrame();
              }
            }, 600);
          }, 500);
        } else {
          setProgress(currentProgress);
        }
      }, interval);
    }
    
    return () => {
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }
    };
  }, [captureStage, captureMode]);

  // Start capturing process
  const startCapture = () => {
    setIsCapturing(true);
    // The actual capture will happen during the progress animation
  };

  // Complete dark frame capture and return to ready state
  const completeDarkFrameCapture = () => {
    try {
      // Simulate capturing a dark frame
      setDarkFrameCaptured(true);
      setCaptureStage('ready');
      setCaptureDone(false);
      setCaptureMode(null);
      setIsCapturing(false);
      
      // Let the user know
      toast.success(
        t("Dark frame captured successfully", "暗帧已成功捕获"),
        { description: t("Now you can measure the sky brightness", "现在您可以测量天空亮度") }
      );
    } catch (error) {
      console.error("Error in dark frame capture:", error);
      handleCaptureError("Error processing dark frame");
    }
  };

  // Handle any capture errors
  const handleCaptureError = (errorMsg: string) => {
    setError(t(errorMsg, errorMsg));
    setCaptureStage('ready');
    setIsCapturing(false);
    setCaptureMode(null);
    setCaptureDone(false);
    toast.error(t("Capture failed", "捕获失败"), { 
      description: t(errorMsg, errorMsg) 
    });
  };

  // Process the captured frame (light/sky frame)
  const processCapturedFrame = () => {
    try {
      setTimeout(() => {
        if (!videoRef.current || !canvasRef.current) {
          setCaptureStage('ready');
          setError(t("Error accessing camera elements", "访问相机元素时出错"));
          return;
        }
        
        // Capture the frame and process it
        const imageData = captureVideoFrame(videoRef.current, canvasRef.current);
        
        if (!imageData) {
          setCaptureStage('ready');
          setError(t("Failed to capture image data", "无法捕获图像数据"));
          return;
        }
        
        // Count stars and calculate Bortle scale
        const starCount = countStarsInImage(imageData);
        const avgBrightness = calculateAverageBrightness(imageData.data);
        const bortleScale = calculateBortleFromStars(starCount, avgBrightness);
        
        // Complete the capture process
        setCaptureStage('complete');
        setIsCapturing(false);
        onCaptureComplete(bortleScale, starCount);
        
        // Reset for next capture
        setCaptureMode(null);
        
        // Let the user know
        toast.success(
          t("Sky measurement complete", "天空测量完成"),
          { description: t("Bortle scale calculated based on star visibility", "基于星星可见度计算的伯特尔等级") }
        );
      }, 800);
    } catch (error) {
      console.error("Error processing captured frame:", error);
      handleCaptureError("Error processing image data");
    }
  };

  // Start a new capture with countdown
  const beginCapture = (mode: 'dark' | 'light') => {
    // Check if we can proceed
    if (mode === 'light' && !darkFrameCaptured) {
      toast.error(
        t("Dark frame required", "需要暗帧"),
        { description: t("Please capture a dark frame first", "请先捕获暗帧") }
      );
      return;
    }
    
    if (captureStage !== 'ready') {
      return; // Don't start if already in progress
    }
    
    // Start the capture process
    setCaptureMode(mode);
    setCountdown(3);
    setCaptureStage('countdown');
    setError(null);
    
    toast.info(
      mode === 'dark' 
        ? t("Preparing for dark frame capture", "准备捕获暗帧") 
        : t("Preparing for sky measurement", "准备测量天空"),
      { description: t("Hold steady in 3 seconds...", "3秒后保持稳定...") }
    );
  };

  return {
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
  };
};
