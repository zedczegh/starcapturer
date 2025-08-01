import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, MapPin, Stars, Camera, Telescope } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const MapLoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading map data...", 
  className 
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={cn("flex flex-col items-center space-y-4 p-8", className)}
  >
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <MapPin className="h-8 w-8 text-primary" />
      </motion.div>
      <motion.div
        className="absolute -top-1 -right-1"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-2 h-2 bg-primary rounded-full" />
      </motion.div>
    </div>
    <p className="text-cosmic-200 text-center">{message}</p>
  </motion.div>
);

export const PhotoPointsLoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Discovering amazing photo points...", 
  className 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("flex flex-col items-center space-y-6 p-8", className)}
  >
    <div className="relative">
      <motion.div
        animate={{ rotateY: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Camera className="h-10 w-10 text-primary" />
      </motion.div>
      <motion.div
        className="absolute inset-0 border-2 border-primary/30 rounded-full"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
    <div className="text-center space-y-2">
      <p className="text-cosmic-200 text-lg">{message}</p>
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

export const AstronomyLoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Calculating celestial wonders...", 
  className 
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn("flex flex-col items-center space-y-6 p-8", className)}
  >
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="relative"
      >
        <Telescope className="h-12 w-12 text-primary" />
      </motion.div>
      
      {/* Floating stars */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: `${20 + i * 15}%`,
            left: `${30 + i * 10}%`,
          }}
          animate={{
            y: [-5, 5, -5],
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Stars className="h-3 w-3 text-cosmic-400" />
        </motion.div>
      ))}
    </div>
    
    <div className="text-center space-y-3">
      <p className="text-cosmic-200 text-lg font-medium">{message}</p>
      <motion.div
        className="h-1 w-64 bg-cosmic-800/40 rounded-full overflow-hidden"
        initial={{ width: 0 }}
        animate={{ width: "16rem" }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-cosmic-400"
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          }}
          style={{ width: "30%" }}
        />
      </motion.div>
    </div>
  </motion.div>
);

export const DataLoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading data...", 
  className 
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={cn("flex items-center space-x-3 p-4", className)}
  >
    <Loader2 className="h-5 w-5 animate-spin text-primary" />
    <span className="text-cosmic-200">{message}</span>
  </motion.div>
);

export const SearchLoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Searching through the cosmos...", 
  className 
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={cn("flex flex-col items-center space-y-4 py-8", className)}
  >
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="border-2 border-primary/30 border-t-primary rounded-full w-8 h-8"
      />
      <motion.div
        className="absolute inset-2 border border-primary/20 border-t-primary/60 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
    <p className="text-cosmic-200 text-center">{message}</p>
  </motion.div>
);