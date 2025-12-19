export interface StickerConfig {
  emotions: string[];
  refImage: string | null; // Base64
  refImageMimeType: string;
}

export interface GeneratedSticker {
  id: string;
  emotion: string;
  imageUrl: string; // Base64 or Blob URL
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
}

export interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
}