import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function VideoCard() {
  const { file } = useAppContext();
  const fileUrl = file ? URL.createObjectURL(file) : null;

  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      className="glass-card overflow-hidden flex flex-col h-fit"
    >
      <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-sm">
        <h3 className="font-semibold text-white">Source Video</h3>
      </div>
      <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
        {fileUrl ? (
          <video src={fileUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" controls controlsList="nodownload" />
        ) : (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
            <Play className="w-12 h-12 text-zinc-700" />
          </div>
        )}
      </div>
      <div className="p-4 bg-card/80">
        <p className="text-sm font-medium text-white truncate">{file?.name || 'video_sample.mp4'}</p>
        <p className="text-xs text-zinc-500 mt-1">Uploaded just now</p>
      </div>
    </motion.div>
  );
}
