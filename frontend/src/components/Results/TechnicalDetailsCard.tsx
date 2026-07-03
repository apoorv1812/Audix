import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Hash, Layers, Video, Clock, Server } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function TechnicalDetailsCard() {
  const { results } = useAppContext();
  const tech = results?.technicalDetails;

  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      className="glass-card p-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-zinc-800/80 text-zinc-400 flex items-center justify-center border border-white/10 shadow-lg">
          <Activity className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-white tracking-wide text-sm uppercase">Technical Meta</h3>
      </div>

      <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center text-zinc-400 text-sm font-medium">
            <Clock className="w-4 h-4 mr-2.5 text-zinc-500" /> Processing Time
          </div>
          <span className="text-sm text-zinc-200 font-mono bg-white/5 px-2 py-0.5 rounded">
            {tech ? `${(tech.processingTimeMs / 1000).toFixed(2)}s` : '...'}
          </span>
        </div>
        
        <div className="flex items-center justify-between border-b border-white/5 py-3">
          <div className="flex items-center text-zinc-400 text-sm font-medium">
            <Layers className="w-4 h-4 mr-2.5 text-zinc-500" /> Extracted Frames
          </div>
          <span className="text-sm text-zinc-200 font-mono bg-white/5 px-2 py-0.5 rounded">
            {tech ? tech.extractedFrames : 0}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center text-zinc-400 text-sm font-medium">
            <Server className="w-4 h-4 mr-2.5 text-zinc-500" /> API Providers
          </div>
          <span className="text-sm text-zinc-200 font-mono bg-white/5 px-2 py-0.5 rounded text-right max-w-[150px] truncate">
            {tech?.apiProvidersUsed?.join(', ') || 'None'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
