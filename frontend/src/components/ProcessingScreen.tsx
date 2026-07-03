import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Music, Clapperboard, FileText, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const steps = [
  { id: 1, text: 'Extracting audio track...', icon: Music },
  { id: 2, text: 'Running optical character recognition...', icon: FileText },
  { id: 3, text: 'Identifying movie frames...', icon: Clapperboard },
  { id: 4, text: 'Synthesizing AI summary...', icon: Cpu },
];

export default function ProcessingScreen() {
  const { appState } = useAppContext();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (appState === 'processing') {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 800);
      return () => clearInterval(interval);
    }
  }, [appState]);

  return (
    <div className="w-full max-w-lg mx-auto glass-card p-10 flex flex-col items-center shadow-2xl">
      <div className="relative mb-10 w-32 h-32 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="absolute inset-0 rounded-full border-t-2 border-r-2 border-accent-blue opacity-50"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          className="absolute inset-4 rounded-full border-b-2 border-l-2 border-accent-purple opacity-50"
        />
        <Cpu className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">
        {appState === 'uploading' ? 'Uploading Video...' : 'Analyzing Intelligence...'}
      </h2>
      <p className="text-zinc-400 mb-8 text-center text-sm">
        Our neural engines are processing your media. This may take a few moments.
      </p>

      {appState === 'processing' && (
        <div className="w-full space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isPast = index < currentStep;

            return (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isPast || isActive ? 1 : 0.4, x: 0 }}
                className="flex items-center space-x-4 bg-white/5 p-3 rounded-lg border border-white/5 transition-all"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isPast ? 'bg-green-500/20 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 
                  isActive ? 'bg-accent-blue/20 text-accent-blue animate-pulse shadow-[0_0_10px_rgba(79,140,255,0.3)]' : 
                  'bg-white/10 text-zinc-500'
                }`}>
                  {isPast ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                  {step.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {appState === 'uploading' && (
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-4">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-accent-blue to-accent-purple"
          />
        </div>
      )}
    </div>
  );
}
