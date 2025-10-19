import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Upload } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  fileName?: string;
  show: boolean;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ 
  progress, 
  fileName,
  show 
}) => {
  const isComplete = progress >= 100;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="w-full bg-gradient-to-br from-cosmic-900/90 to-cosmic-950/90 border-2 border-cosmic-700/40 rounded-xl p-5 shadow-2xl backdrop-blur-sm"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5 rounded-xl blur-xl pointer-events-none"></div>
          
          <div className="relative space-y-3">
            {/* Header with icon */}
            <div className="flex items-center gap-3">
              <motion.div
                animate={isComplete ? { rotate: 360, scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    <motion.div
                      className="absolute inset-0"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Upload className="h-5 w-5 text-blue-400" />
                    </motion.div>
                  </>
                )}
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {fileName ? fileName : 'Uploading image...'}
                </p>
                <p className="text-xs text-cosmic-300">
                  {isComplete ? 'Upload complete!' : 'Processing image...'}
                </p>
              </div>
              
              <motion.span 
                className="text-base font-bold tabular-nums text-white"
                key={progress}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {progress}%
              </motion.span>
            </div>
            
            {/* Enhanced progress bar */}
            <div className="relative">
              <div className="w-full h-3 bg-cosmic-800/60 rounded-full overflow-hidden border border-cosmic-700/30 shadow-inner">
                <motion.div
                  className={`h-full relative transition-colors duration-300 ${
                    isComplete 
                      ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500' 
                      : 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ 
                    duration: 0.3, 
                    ease: [0.4, 0, 0.2, 1]
                  }}
                >
                  {/* Animated shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </motion.div>
              </div>
              
              {/* Glow under progress bar */}
              <motion.div 
                className={`absolute -bottom-1 left-0 h-2 blur-md transition-colors duration-300 ${
                  isComplete
                    ? 'bg-gradient-to-r from-emerald-500/60 via-emerald-400/60 to-emerald-500/60'
                    : 'bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-blue-500/40'
                }`}
                animate={{ width: `${progress}%` }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.4, 0, 0.2, 1]
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
