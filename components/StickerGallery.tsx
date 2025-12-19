import React from 'react';
import { Download, AlertCircle, RefreshCw } from 'lucide-react';
import { GeneratedSticker } from '../types';

interface StickerGalleryProps {
  stickers: GeneratedSticker[];
  onRetry: (id: string) => void;
}

const StickerGallery: React.FC<StickerGalleryProps> = ({ stickers, onRetry }) => {
  if (stickers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 border border-slate-700 rounded-xl bg-slate-800/30">
        <div className="mb-4 opacity-50">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <p>No stickers generated yet.</p>
        <p className="text-sm">Upload an image and start the magic.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {stickers.map((sticker) => (
        <div 
          key={sticker.id} 
          className="relative group bg-slate-800 rounded-lg overflow-hidden aspect-square border border-slate-700 hover:border-indigo-500 transition-all"
        >
          {sticker.status === 'completed' && (
            <>
              <img 
                src={sticker.imageUrl} 
                alt={sticker.emotion} 
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <a 
                  href={sticker.imageUrl} 
                  download={`sticker_${sticker.emotion}.png`}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white"
                  title="Download Single"
                >
                  <Download size={20} />
                </a>
              </div>
            </>
          )}

          {sticker.status === 'generating' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-2"></div>
              <span className="text-xs text-indigo-400 font-medium animate-pulse">Generating...</span>
            </div>
          )}

          {sticker.status === 'pending' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 p-4 text-center opacity-50">
               <span className="text-xs text-slate-400">Pending...</span>
             </div>
          )}

          {sticker.status === 'failed' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-4 text-center">
              <AlertCircle className="text-red-500 mb-2" size={24} />
              <span className="text-xs text-red-400 mb-2">Generation Failed</span>
              <button 
                onClick={() => onRetry(sticker.id)}
                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-white flex items-center gap-1"
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {/* Label Tag */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1.5 text-center">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              {sticker.emotion}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StickerGallery;