import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { fileToBase64, getMimeType } from '../utils/imageProcessing';

interface ImageUploaderProps {
  currentImage: string | null;
  onImageSelect: (base64: string, mimeType: string) => void;
  onClear: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onImageSelect, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        const mimeType = getMimeType(file);
        onImageSelect(base64, mimeType);
      } catch (err) {
        console.error("Error processing file", err);
      }
    }
  };

  if (currentImage) {
    return (
      <div className="relative w-full aspect-square max-w-sm mx-auto bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-600 group">
        <img 
          src={`data:image/png;base64,${currentImage}`} 
          alt="Reference Character" 
          className="w-full h-full object-contain p-4"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button 
            onClick={onClear}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-transform transform hover:scale-110"
          >
            <X size={24} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full aspect-square max-w-sm mx-auto bg-slate-800 rounded-xl border-2 border-dashed border-slate-600 hover:border-indigo-500 hover:bg-slate-700/50 transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center"
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4 text-indigo-400">
        <Upload size={32} />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">Upload Reference Character</h3>
      <p className="text-sm text-slate-400">JPG or PNG. Square aspect ratio recommended.</p>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
      />
    </div>
  );
};

export default ImageUploader;