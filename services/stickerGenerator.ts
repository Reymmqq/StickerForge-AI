import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME } from '../constants';

// Initialize the API client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set it in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSingleSticker = async (
  refImageBase64: string,
  refImageMimeType: string,
  emotion: string
): Promise<string> => {
  const ai = getAiClient();

  const prompt = `
    Generate a Telegram sticker based on the attached character reference.
    
    Action/Emotion: ${emotion}
    
    Visual Style:
    - Vector art illustration
    - Flat design with clean lines
    - Required: Thick WHITE OUTLINE around the character (sticker die-cut style)
    - Required: Solid BLACK background
    - No text or writing in the image
    
    Character Consistency:
    - Match the character's appearance, colors, and accessories from the reference image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: refImageMimeType,
              data: refImageBase64,
            },
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    // Extract image from response
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      let textResponse = "";
      
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
        }
        if (part.text) {
            textResponse += part.text;
        }
      }
      
      // If we found text but no image, throw an error with the text for debugging
      if (textResponse) {
          throw new Error(`AI returned text instead of image: "${textResponse.slice(0, 150)}..."`);
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};