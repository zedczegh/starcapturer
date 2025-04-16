
import React from 'react';
import { motion } from 'framer-motion';

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <motion.div 
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative w-16 h-16">
        <motion.div 
          className="absolute top-0 left-0 w-full h-full border-4 border-primary/30 rounded-full"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Decorative animated dots */}
        <motion.div 
          className="absolute -right-1 -top-1 h-3 w-3 bg-primary rounded-full"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.div 
          className="absolute -left-1 -bottom-1 h-2 w-2 bg-blue-400 rounded-full"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatType: "reverse", delay: 0.3 }}
        />
      </div>
      
      <motion.p 
        className="mt-4 text-primary/80 font-medium"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      >
        Loading...
      </motion.p>
    </motion.div>
  </div>
);

export default PageLoader;
