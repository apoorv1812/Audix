import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Uploader from './components/Uploader';
import ProcessingScreen from './components/ProcessingScreen';
import ResultsDashboard from './components/ResultsDashboard';
import { useAppContext } from './context/AppContext';

export default function App() {
  const { appState } = useAppContext();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-blue/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-purple/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <Navigation />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {appState === 'idle' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-full flex flex-col items-center justify-center space-y-16 my-10"
            >
              <Hero />
              <Uploader />
            </motion.div>
          )}

          {(appState === 'uploading' || appState === 'processing') && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="w-full flex justify-center my-20"
            >
              <ProcessingScreen />
            </motion.div>
          )}

          {appState === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full my-10"
            >
              <ResultsDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <footer className="w-full text-center py-6 text-zinc-500 text-sm glass mt-auto border-t-0 border-x-0 border-b-0 border-white/5 relative z-10">
        &copy; {new Date().getFullYear()} Audix AI. All rights reserved.
      </footer>
    </div>
  );
}
