import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  return (
    <div className="w-full min-h-screen bg-gray-950 flex items-center justify-center">
      <motion.div 
        className="flex flex-col items-center gap-4" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-12 h-12 border-2 border-gray-600 border-t-gray-300 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-gray-500">Loading budget report...</p>
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;