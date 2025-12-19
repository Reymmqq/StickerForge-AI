import { OUTPUT_SIZE, BADGE_HEIGHT, FONT_SIZE } from '../constants';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/png;base64,") to get just the base64 string
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const getMimeType = (file: File): string => {
  return file.type;
};

/**
 * Adds the "Badge" with the emotion name and ensures black background/dimensions.
 */
export const postProcessSticker = async (
  base64Image: string,
  emotion: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // 1. Fill Black Background (Requirement 4.2)
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw the generated sticker image (centered, contain)
      // We assume the AI generates a square image, but let's be safe
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 3. Draw Badge (Requirement 5)
      // Badge Style: Rounded pill shape at top center
      const text = emotion.toUpperCase();
      ctx.font = `bold ${FONT_SIZE}px Inter, sans-serif`;
      const textMetrics = ctx.measureText(text);
      const paddingX = 40;
      const paddingY = 20;
      const badgeWidth = textMetrics.width + (paddingX * 2);
      const badgeHeight = FONT_SIZE + (paddingY * 2);
      const badgeX = (canvas.width - badgeWidth) / 2;
      const badgeY = 40; // Top margin

      // Draw Badge Background
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 30);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fill();
      
      // Badge Border
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw Text
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, canvas.width / 2, badgeY + (badgeHeight / 2) + 2); // +2 for visual center

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load generated image for processing"));
    img.src = `data:image/png;base64,${base64Image}`;
  });
};