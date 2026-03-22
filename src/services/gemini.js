import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
// Model confirmed available for this API key via ListModels check
const MODEL = "gemini-2.5-flash";

const ai = new GoogleGenAI({ apiKey });

export const geminiService = {
  async generateText(prompt, image) {
    const contents = image
      ? [{ parts: [{ text: prompt }, { inlineData: { data: image.data || image.base64, mimeType: image.mimeType } }] }]
      : [{ parts: [{ text: prompt }] }];

    const response = await ai.models.generateContent({ model: MODEL, contents });
    return response.text || "";
  },

  async generateImage(prompt, images = []) {
    const parts = [{ text: prompt }];
    images.forEach(img => parts.push({ inlineData: { data: img.data || img.base64, mimeType: img.mimeType } }));
    const response = await ai.models.generateContent({ model: MODEL, contents: [{ parts }] });
    return response.text || "";
  }
};
