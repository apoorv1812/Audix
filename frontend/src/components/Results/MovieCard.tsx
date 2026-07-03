import React from 'react';
import { motion } from 'framer-motion';
import { Film, Star, AlertCircle, Clock, Tv, Globe } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function MovieCard() {
  const { results } = useAppContext();
  const movie = results?.movie;

  if (!movie || movie.status === 'NOT_CONFIGURED') {
    return (
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="glass-card p-6 relative overflow-hidden group h-full flex flex-col justify-center items-center text-center">
        <Film className="w-12 h-12 text-zinc-600 mb-4" />
        <h3 className="font-semibold text-zinc-400">Movie Provider Not Configured</h3>
      </motion.div>
    );
  }

  if (movie.status === 'UNIDENTIFIED' || movie.status === 'ERROR') {
    return (
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="glass-card p-6 relative overflow-hidden group h-full flex flex-col justify-center items-center text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500/50 mb-4" />
        <h3 className="font-semibold text-zinc-400">Not Identified</h3>
        <p className="text-xs text-zinc-500 mt-2">Could not confidently identify a movie or TV show.</p>
      </motion.div>
    );
  }

  const metadata = movie.metadata;
  const hasPoster = metadata?.poster;

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="glass-card p-6 relative overflow-hidden group h-full flex flex-col">
      {/* Background Poster Blur */}
      {hasPoster && (
        <div 
          className="absolute inset-0 opacity-[0.15] mix-blend-overlay transition-opacity duration-700 group-hover:opacity-[0.25]"
          style={{ backgroundImage: `url(${metadata.poster})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}
      
      {!hasPoster && (
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
          <Film className="w-32 h-32 text-accent-blue" />
        </div>
      )}
      
      <div className="flex items-center space-x-3 mb-4 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-accent-blue/20 text-accent-blue flex items-center justify-center shadow-lg border border-accent-blue/10">
          <Film className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <h3 className="font-semibold text-white tracking-wide text-sm uppercase">Visual Recognition</h3>
          <div className="flex space-x-2 mt-1">
            <span className="text-[10px] font-bold bg-white/10 text-white/70 px-1.5 py-0.5 rounded">Gemini Vision</span>
            {metadata?.providerName && (
              <span className="text-[10px] font-bold bg-accent-blue/20 text-accent-blue px-1.5 py-0.5 rounded">{metadata.providerName}</span>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-end mt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-2xl font-bold text-white mb-2 tracking-tight">{movie.title || 'Unknown Title'}</h4>
            <div className="flex items-center space-x-2 text-zinc-400 font-medium text-sm flex-wrap gap-y-2 mb-3">
              {metadata?.releaseYear && <span className="px-2 py-0.5 bg-white/5 rounded-md border border-white/5 flex items-center"><Star className="w-3 h-3 mr-1"/>{metadata.releaseYear}</span>}
              {movie.type && <span className="px-2 py-0.5 bg-white/5 rounded-md border border-white/5 flex items-center"><Film className="w-3 h-3 mr-1"/>{movie.type}</span>}
              {metadata?.runtime && <span className="px-2 py-0.5 bg-white/5 rounded-md border border-white/5 flex items-center"><Clock className="w-3 h-3 mr-1"/>{metadata.runtime}</span>}
            </div>
            {metadata?.genre && (
              <p className="text-xs text-zinc-500 mb-3">{metadata.genre}</p>
            )}
          </div>
          {hasPoster && (
            <img src={metadata.poster} alt={movie.title} className="w-20 h-28 object-cover rounded-lg shadow-xl border border-white/10 ml-4 hidden sm:block group-hover:scale-105 transition-transform duration-500" />
          )}
        </div>
        
        {metadata?.network && (
          <div className="flex items-center text-xs text-zinc-400 mb-4 bg-white/5 self-start px-2 py-1 rounded">
            <Tv className="w-3 h-3 mr-1.5 text-accent-blue" />
            Network: <span className="text-white ml-1 font-semibold">{metadata.network}</span>
          </div>
        )}

        <div className="mt-auto flex flex-col space-y-3">
          {metadata?.status === 'UNSUPPORTED_PROVIDER' && (
            <div className="text-xs font-semibold text-yellow-500 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
              Current metadata provider supports TV shows only.
            </div>
          )}
          
          {metadata?.status === 'PROVIDER_UNAVAILABLE' && (
            <div className="text-xs font-semibold text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
              Metadata provider is currently unavailable.
            </div>
          )}

          <div className="flex items-center justify-between bg-black/40 p-3.5 rounded-xl border border-white/5 backdrop-blur-md">
            <div className="flex items-center space-x-2">
              {(!metadata || metadata.status === 'NOT_CONFIGURED') ? (
                <span className="text-zinc-500 text-xs font-semibold">Metadata provider not configured.</span>
              ) : metadata.status === 'SUCCESS' ? (
                <>
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                  <span className="text-white text-sm font-bold">{metadata.imdbRating || 'N/A'}<span className="text-zinc-500 font-normal">/10</span></span>
                </>
              ) : null}
            </div>
            
            <div className="flex items-center space-x-2">
              {metadata?.officialUrl && (
                <a href={metadata.officialUrl} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              <span className="text-xs font-semibold text-accent-blue bg-accent-blue/10 px-2.5 py-1 rounded-md border border-accent-blue/20 shadow-inner">
                Confidence: {movie.confidence}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
