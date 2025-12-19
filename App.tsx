import React, { useState, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { Download, Sparkles, Settings, AlertTriangle } from 'lucide-react';

import { StickerConfig, GeneratedSticker, ProcessingStats } from './types';
import { DEFAULT_EMOTIONS } from './constants';
import { generateSingleSticker } from './services/stickerGenerator';
import { postProcessSticker } from './utils/imageProcessing';

import ImageUploader from './components/ImageUploader';
import StickerGallery from './components/StickerGallery';
import Button from './components/Button';

const App: React.FC = () => {
  const [config, setConfig] = useState<StickerConfig>({
    emotions: DEFAULT_EMOTIONS,
    refImage: null,
    refImageMimeType: ''
  });
  
  const [stickers, setStickers] = useState<GeneratedSticker[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [emotionsInput, setEmotionsInput] = useState(DEFAULT_EMOTIONS.join('\n'));

  // Stats
  const stats: ProcessingStats = useMemo(() => {
    return {
      total: stickers.length,
      completed: stickers.filter(s => s.status === 'completed').length,
      failed: stickers.filter(s => s.status === 'failed').length
    };
  }, [stickers]);

  const handleImageSelect = (base64: string, mimeType: string) => {
    setConfig(prev => ({ ...prev, refImage: base64, refImageMimeType: mimeType }));
  };

  const handleClearImage = () => {
    setConfig(prev => ({ ...prev, refImage: null, refImageMimeType: '' }));
    setStickers([]);
  };

  const handleUpdateEmotions = () => {
    const newEmotions = emotionsInput.split('\n').filter(line => line.trim().length > 0);
    setConfig(prev => ({ ...prev, emotions: newEmotions }));
    setShowSettings(false);
  };

  // The Core Logic
  const startGeneration = useCallback(async () => {
    if (!config.refImage) return;

    // Initialize sticker placeholders
    const newStickers: GeneratedSticker[] = config.emotions.map(emotion => ({
      id: crypto.randomUUID(),
      emotion,
      imageUrl: '',
      status: 'pending'
    }));

    setStickers(newStickers);
    setIsProcessing(true);

    // Process one by one (or with a small concurrency limit) to be nice to the API/Browser
    // We'll do sequential here for simplicity and to avoid rate limits
    for (let i = 0; i < newStickers.length; i++) {
        const currentSticker = newStickers[i];
        
        // Update status to generating
        setStickers(prev => prev.map(s => s.id === currentSticker.id ? { ...s, status: 'generating' } : s));

        try {
            // 1. Generate Image with AI
            const rawImageBase64 = await generateSingleSticker(
                config.refImage!, 
                config.refImageMimeType, 
                currentSticker.emotion
            );

            // 2. Post-process (Add Badge & BG)
            const finalDataUrl = await postProcessSticker(rawImageBase64, currentSticker.emotion);

            // 3. Update Success
            setStickers(prev => prev.map(s => 
                s.id === currentSticker.id 
                ? { ...s, status: 'completed', imageUrl: finalDataUrl } 
                : s
            ));

        } catch (error: any) {
            console.error(`Failed to generate ${currentSticker.emotion}`, error);
            setStickers(prev => prev.map(s => 
                s.id === currentSticker.id 
                ? { ...s, status: 'failed', error: error.message || "Generation failed" } 
                : s
            ));
        }
    }

    setIsProcessing(false);
  }, [config]);

  const handleRetry = async (id: string) => {
    const stickerToRetry = stickers.find(s => s.id === id);
    if (!stickerToRetry || !config.refImage) return;

    setStickers(prev => prev.map(s => s.id === id ? { ...s, status: 'generating', error: undefined } : s));

    try {
        const rawImageBase64 = await generateSingleSticker(
            config.refImage,
            config.refImageMimeType,
            stickerToRetry.emotion
        );
        const finalDataUrl = await postProcessSticker(rawImageBase64, stickerToRetry.emotion);
        
        setStickers(prev => prev.map(s => 
            s.id === id 
            ? { ...s, status: 'completed', imageUrl: finalDataUrl } 
            : s
        ));
    } catch (error: any) {
        setStickers(prev => prev.map(s => 
            s.id === id 
            ? { ...s, status: 'failed', error: error.message } 
            : s
        ));
    }
  };

  const downloadZip = async () => {
    const completedStickers = stickers.filter(s => s.status === 'completed');
    if (completedStickers.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder("sticker_pack");

    completedStickers.forEach(sticker => {
      // imageUrl is data:image/png;base64,.....
      const base64Data = sticker.imageUrl.split(',')[1];
      folder?.file(`${sticker.emotion.replace(/\s+/g, '_').toLowerCase()}.png`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "telegram_sticker_pack.zip");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
              <Sparkles className="text-indigo-400" />
              StickerForge AI
            </h1>
            <p className="text-slate-400 mt-2">Generate Telegram sticker packs in one click from a single image.</p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowSettings(!showSettings)}
              disabled={isProcessing}
            >
              <Settings size={18} /> Configure Emotions
            </Button>
            {stats.completed > 0 && (
               <Button onClick={downloadZip} variant="primary">
                 <Download size={18} /> Download Pack ({stats.completed})
               </Button>
            )}
          </div>
        </header>

        {/* Warning if no API Key */}
        {!process.env.API_KEY && (
           <div className="bg-orange-900/50 border border-orange-500/50 p-4 rounded-lg flex items-center gap-3 text-orange-200">
             <AlertTriangle />
             <p>API Key missing. This app requires a Gemini API key in the environment configuration.</p>
           </div>
        )}

        {/* Settings Modal/Panel */}
        {showSettings && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-semibold text-lg mb-4">Edit Sticker Emotions</h3>
            <p className="text-sm text-slate-400 mb-2">One emotion per line. Current count: {emotionsInput.split('\n').filter(x => x.trim()).length}</p>
            <textarea
              value={emotionsInput}
              onChange={(e) => setEmotionsInput(e.target.value)}
              className="w-full h-48 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex justify-end mt-4">
              <Button onClick={handleUpdateEmotions}>Save List</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">1. Reference Image</h2>
              <ImageUploader 
                currentImage={config.refImage} 
                onImageSelect={handleImageSelect}
                onClear={handleClearImage}
              />
              
              <div className="mt-6">
                 <h2 className="text-xl font-semibold mb-4">2. Generate</h2>
                 <p className="text-slate-400 text-sm mb-4">
                   We will generate {config.emotions.length} stickers based on your list. 
                   Each sticker will be 2K resolution with a black background and badge.
                 </p>
                 <Button 
                   className="w-full py-4 text-lg shadow-lg shadow-indigo-500/20" 
                   onClick={startGeneration}
                   disabled={!config.refImage || isProcessing}
                   isLoading={isProcessing}
                 >
                   {isProcessing ? 'Generating Pack...' : 'Generate Sticker Pack'}
                 </Button>

                 {isProcessing && (
                   <div className="mt-4 text-center text-sm text-slate-400">
                     Processing {stats.completed + stats.failed} / {stats.total}
                     <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                       <div 
                         className="bg-indigo-500 h-full transition-all duration-300"
                         style={{ width: `${((stats.completed + stats.failed) / stats.total) * 100}%` }}
                       ></div>
                     </div>
                   </div>
                 )}
              </div>
            </div>
          </div>

          {/* Right Column: Gallery */}
          <div className="lg:col-span-3">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Results Gallery</h2>
                {stats.total > 0 && (
                    <span className="text-sm bg-slate-800 px-3 py-1 rounded-full text-slate-400">
                        {stats.completed} Success &bull; {stats.failed} Failed
                    </span>
                )}
             </div>
             <StickerGallery stickers={stickers} onRetry={handleRetry} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;