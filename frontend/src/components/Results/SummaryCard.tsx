import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function SummaryCard() {
  const { results } = useAppContext();
  const summary = results?.summary;

  if (!summary || summary.status === 'NOT_CONFIGURED') {
    return (
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="glass-card p-6 flex items-center space-x-4">
        <AlertCircle className="w-8 h-8 text-zinc-600" />
        <p className="text-zinc-400">Summary Provider Not Configured</p>
      </motion.div>
    );
  }

  if (summary.status === 'UNIDENTIFIED' || summary.status === 'ERROR') {
    return (
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="glass-card p-6 flex items-center space-x-4">
        <AlertCircle className="w-8 h-8 text-yellow-500/50" />
        <p className="text-zinc-400">Could not generate a summary for this video.</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="glass-card p-6">
      <div className="flex items-center space-x-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple text-white flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
          <Sparkles className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-white tracking-wide text-sm uppercase">AI Summary</h3>
      </div>
      <p className="text-zinc-300 leading-relaxed text-sm md:text-base whitespace-pre-line">
        {summary.text}
      </p>
    </motion.div>
  );
}
