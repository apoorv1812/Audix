import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileVideo, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Uploader() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setAppState, setFile, file, setProgress, setResults } = useAppContext();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      alert('Please upload a valid video file.');
      return;
    }
    setFile(selectedFile);
  };

  const startProcessing = async () => {
    if (!file) return;
    setAppState('uploading');
    
    try {
      const formData = new FormData();
      formData.append('video', file);

      // Simulate uploading progress since fetch doesn't support progress events natively without XMLHttpRequest
      let progressInterval = setInterval(() => {
        setProgress((p: number) => (p < 90 ? p + 10 : p));
      }, 500);

      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);
      setAppState('processing');

      if (!response.ok) {
        throw new Error('Failed to analyze video');
      }

      const responseData = await response.json();
      setResults(responseData.data);
      
      setAppState('results');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Analysis failed. Check console for details.');
      setAppState('idle');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div 
        className={`relative glass-card p-10 flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 ${
          isDragging ? 'border-accent-blue bg-accent-blue/5 scale-105' : 'border-white/10 hover:border-white/20'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="video/*" 
          className="hidden" 
        />
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div 
              key="upload-prompt"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner transition-transform group-hover:scale-110">
                <UploadCloud className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Upload your video</h3>
              <p className="text-zinc-500 text-center text-sm">
                Drag and drop a file, or click to browse.<br/>
                Supports MP4, MOV, AVI up to 100MB.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="file-info"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center w-full"
            >
              <div className="w-full flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-accent-purple/20 rounded-lg flex items-center justify-center text-accent-purple">
                    <FileVideo className="w-6 h-6" />
                  </div>
                  <div className="text-left overflow-hidden max-w-[200px] sm:max-w-xs">
                    <p className="text-white font-medium truncate">{file.name}</p>
                    <p className="text-zinc-500 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); startProcessing(); }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold shadow-lg hover:shadow-accent-blue/30 transition-all active:scale-[0.98]"
              >
                Analyze Video with AI
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
