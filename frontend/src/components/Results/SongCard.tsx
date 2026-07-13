import React from 'react';
import { motion } from 'framer-motion';
import { Music, Disc, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function SongCard() {
  const { results } = useAppContext();
  const song = results?.song;

  if (!song || song.status === 'NOT_CONFIGURED') {
    return (
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="glass-card p-6 relative overflow-hidden group h-full flex flex-col justify-center items-center text-center">
        <Disc className="w-12 h-12 text-zinc-600 mb-4" />
        <h3 className="font-semibold text-zinc-400">Music Provider Not Configured</h3>
      </motion.div>
    );
  }

  if (song.status === 'UNIDENTIFIED' || song.status === 'ERROR' || song.status === 'TIMEOUT') {
    return (
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="glass-card p-6 relative overflow-hidden group h-full flex flex-col justify-center items-center text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500/50 mb-4" />
        <h3 className="font-semibold text-zinc-400">
          {song.status === 'TIMEOUT' ? 'Analysis Timed Out' : 'Song could not be identified.'}
        </h3>
      </motion.div>
    );
  }

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="glass-card p-6 relative overflow-hidden group h-full flex flex-col">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
        <Disc className="w-32 h-32 text-accent-purple" />
      </div>
      
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent-purple/20 text-accent-purple flex items-center justify-center shadow-lg border border-accent-purple/10">
          <Music className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-white tracking-wide text-sm uppercase">Audio Match</h3>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-end">
        <h4 className="text-3xl font-bold text-white mb-1 truncate tracking-tight">{song.title || 'Unknown Song'}</h4>
        <p className="text-zinc-400 font-medium text-lg">{song.artist || 'Unknown Artist'}</p>
        
        <div className="mt-8 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-zinc-500 uppercase">Confidence</span>
            <span className="text-accent-purple">{song.confidence}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${song.confidence || 0}%` }}
              transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-accent-purple/50 to-accent-purple rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
