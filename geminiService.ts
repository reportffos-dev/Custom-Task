
import { GoogleGenAI } from "@google/genai";

// Standard file to base64 conversion utility
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const generateModifiedImage = async (
  base64Data: string,
  mimeType: string,
  prompt: string,
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1"
): Promise<string> => {
  // Always use this specific initialization pattern as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are a world-class AI image editor and digital artist. 
    Your mission is to modify the provided image according to the user's prompt.
    
    CORE REQUIREMENTS:
    1. ACCURACY: Follow the user's instructions precisely. If they want to change the style, background, or add/remove elements, do it with high fidelity.
    2. QUALITY: Ensure the final result is high-resolution, aesthetically pleasing, and free of artifacts.
    3. CONSISTENCY: Maintain the core identity of the main subjects in the image unless instructed otherwise.
    4. No extra text, watermarks, or distorted elements.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Modify this image based on the following instructions: ${prompt}. Ensure the final result is professional and high-quality.`,
          },
        ],
      },
      config: {
        systemInstruction,
        imageConfig: {
          aspectRatio: aspectRatio,
        }
      },
    });

    let imageUrl = '';
    // Guideline: Iterate through parts to find the image, do not assume it's the first part.
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error("No image was generated in the response.");
    }

    return imageUrl;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
