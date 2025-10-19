import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

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
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full space-y-2 mt-2"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-cosmic-300 truncate flex-1">
              {fileName || 'Processing...'}
            </p>
            {isComplete && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 ml-2" />
              </motion.div>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="relative">
            <div className="w-full h-2 bg-cosmic-800/60 rounded-full overflow-hidden border border-cosmic-700/30">
              <motion.div
                className={`h-full ${
                  isComplete 
                    ? 'bg-emerald-500' 
                    : 'bg-blue-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
