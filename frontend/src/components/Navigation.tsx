import React from 'react';
import { motion } from 'framer-motion';
import { PlaySquare, Github } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Navigation() {
  const { setAppState, setFile, setResults } = useAppContext();

  const goHome = () => {
    setAppState('idle');
    setFile(null);
    setResults(null);
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 w-full glass border-b border-white/5 px-6 py-4 flex items-center justify-between"
    >
      <div 
        className="flex items-center space-x-3 cursor-pointer group"
        onClick={goHome}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] flex items-center justify-center shadow-lg group-hover:shadow-accent-blue/30 transition-shadow">
          <PlaySquare className="w-5 h-5 text-white" fill="currentColor" />
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent-blue group-hover:to-accent-purple transition-all">
          Audix
        </span>
      </div>

      <div className="flex items-center space-x-6">
        <a href="https://github.com/audix/audix" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors flex items-center space-x-2">
          <Github className="w-5 h-5" />
          <span className="hidden sm:inline-block text-sm font-medium">Star on GitHub</span>
        </a>
      </div>
    </motion.nav>
  );
}
