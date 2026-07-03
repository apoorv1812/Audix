import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <div className="text-center max-w-3xl mx-auto space-y-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md mb-4"
      >
        <Sparkles className="w-4 h-4 text-accent-blue" />
        <span className="text-sm font-medium text-zinc-300">Audix V1 is now live</span>
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight"
      >
        Understand any video with <span className="text-gradient">AI magic</span>
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-medium"
      >
        Upload a clip to instantly identify songs, recognize movies, extract transcripts, and generate rich summaries—all processed locally and securely.
      </motion.p>
    </div>
  );
}
