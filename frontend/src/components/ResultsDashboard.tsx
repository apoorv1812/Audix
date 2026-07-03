import React from 'react';
import { motion } from 'framer-motion';
import VideoCard from './Results/VideoCard';
import SongCard from './Results/SongCard';
import MovieCard from './Results/MovieCard';
import TranscriptCard from './Results/TranscriptCard';
import SummaryCard from './Results/SummaryCard';
import TechnicalDetailsCard from './Results/TechnicalDetailsCard';

export default function ResultsDashboard() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-4">
        <h2 className="text-3xl font-bold text-white tracking-tight">Analysis Results</h2>
        <span className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full text-xs font-semibold border border-green-500/20 flex items-center shadow-[0_0_15px_rgba(34,197,94,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
          Analysis Complete
        </span>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left Column: Video & Technical Details */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <VideoCard />
          <TechnicalDetailsCard />
        </div>

        {/* Right Column: Insights */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SongCard />
            <MovieCard />
          </div>
          <SummaryCard />
          <TranscriptCard />
        </div>
      </motion.div>
    </div>
  );
}
