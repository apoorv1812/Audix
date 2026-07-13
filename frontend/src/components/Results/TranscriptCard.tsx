import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function TranscriptCard() {
  const [copied, setCopied] = React.useState(false);
  const { results } = useAppContext();
  const transcript = results?.transcript;

  const handleCopy = () => {
    if (transcript?.dialogue) {
      navigator.clipboard.writeText(transcript.dialogue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!transcript || transcript.status === 'NOT_CONFIGURED') {
    return (
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="glass-card p-6 flex flex-col justify-center items-center text-center h-[200px]">
        <FileText className="w-8 h-8 text-zinc-600 mb-2" />
        <h3 className="font-semibold text-zinc-400">Speech Provider Not Configured</h3>
      </motion.div>
    );
  }

  if (transcript.status === 'UNIDENTIFIED' || transcript.status === 'ERROR' || transcript.status === 'TIMEOUT' || !transcript.dialogue) {
    return (
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="glass-card p-6 flex flex-col justify-center items-center text-center h-[200px]">
        <AlertCircle className="w-8 h-8 text-yellow-500/50 mb-2" />
        <h3 className="font-semibold text-zinc-400">
          {transcript.status === 'TIMEOUT' ? 'Analysis Timed Out' : 'No Speech Detected'}
        </h3>
        <p className="text-xs text-zinc-500 mt-2">
          {transcript.status === 'TIMEOUT'
            ? 'The video might be too long to process.'
            : 'No dialogue or transcript could be identified in this video.'}
        </p>
      </motion.div>
    );
  }

  // Handle newlines as separate dialogue entries to simulate line-by-line breakdown
  const dialogueLines = transcript.dialogue.split('\n').filter((l: string) => l.trim().length > 0);

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="glass-card p-6 flex flex-col h-full max-h-[350px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center border border-white/10 shadow-lg">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white tracking-wide text-sm uppercase">
            Transcript {transcript.language ? `(${transcript.language})` : ''}
          </h3>
        </div>
        <button 
          onClick={handleCopy}
          className="p-2 hover:bg-white/10 rounded-lg transition-all text-zinc-400 hover:text-white border border-transparent hover:border-white/10"
          title="Copy to clipboard"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar">
        {dialogueLines.map((line: string, i: number) => (
          <div key={i} className="flex gap-4 group hover:bg-white/[0.02] p-2 rounded-lg -mx-2 transition-colors">
            <p className="text-sm text-zinc-300 group-hover:text-white transition-colors leading-relaxed">
              {line}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
