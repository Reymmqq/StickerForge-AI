export const DEFAULT_EMOTIONS = [
  "Happy",
  "Sad",
  "Angry",
  "Love",
  "Surprised",
  "Laughing",
  "Cool",
  "Confused",
  "Sleepy",
  "Thumbs Up",
  "Ok",
  "Hi",
  "Bye",
  "Party",
  "Working",
  "Eating",
  "Sick",
  "Rich",
  "Idea",
  "Facepalm"
];

export const MODEL_NAME = "gemini-2.5-flash-image"; // Efficient for batch generation
export const HIGH_QUAL_MODEL = "gemini-3-pro-image-preview"; // Optional for higher quality

// Canvas settings for 2K resolution (approx)
export const OUTPUT_SIZE = 1024; // Telegram usually prefers 512, but request asked for 2K (2048). 1024 is a safe middle ground for generation speed vs quality.
export const BADGE_HEIGHT = 120;
export const FONT_SIZE = 48;