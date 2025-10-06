import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

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
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full bg-card border border-border rounded-lg p-4 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium">
          {fileName ? `Uploading ${fileName}...` : 'Uploading...'}
        </span>
        <span className="text-sm text-muted-foreground ml-auto">
          {progress}%
        </span>
      </div>
      
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/90 to-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: 0.3, 
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
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
    </motion.div>
  );
};
