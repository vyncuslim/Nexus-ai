import { GoogleGenAI, Chat, GenerateContentResponse, Modality } from "@google/genai";
import { ChatMessage, Role } from "../types";

// Initialize the client strictly using the environment variable as per guidelines
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Creates a chat session and returns a stream of responses (Text).
 */
export const streamGeminiResponse = async (
  modelId: string,
  history: ChatMessage[],
  newMessage: string,
  systemInstruction: string,
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    const ai = getAiClient();
    const chat: Chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessageStream({ message: newMessage });
    
    let fullText = "";

    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        fullText += c.text;
        onChunk(fullText);
      }
    }

    return fullText;

  } catch (error) {
    console.error("Gemini Text Service Error:", error);
    throw error;
  }
};

/**
 * Generates an image using gemini-3-pro-image-preview.
 */
export const generateImage = async (prompt: string, imageSize: string = "1K"): Promise<string> => {
  const ai = getAiClient();
  
  // Check for Veo/Image specific API key requirements if running in AI Studio context
  if (typeof window !== 'undefined' && (window as any).aistudio) {
     const hasKey = await (window as any).aistudio.hasSelectedApiKey();
     if (!hasKey) {
       await (window as any).aistudio.openSelectKey();
       // We must recreate client after selection to pick up new key
     }
  }
  const freshAi = getAiClient();

  const response = await freshAi.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: imageSize
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64EncodeString: string = part.inlineData.data;
      return `data:image/png;base64,${base64EncodeString}`;
    }
  }
  throw new Error("No image data received");
};

/**
 * Generates a video using veo-3.1-fast-generate-preview.
 */
export const generateVideo = async (prompt: string, aspectRatio: string = "16:9"): Promise<string> => {
  const ai = getAiClient();
  
  if (typeof window !== 'undefined' && (window as any).aistudio) {
     const hasKey = await (window as any).aistudio.hasSelectedApiKey();
     if (!hasKey) {
       await (window as any).aistudio.openSelectKey();
     }
  }
  const freshAi = getAiClient();

  let operation = await freshAi.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    }
  });

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await freshAi.operations.getVideosOperation({operation: operation});
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");

  // Fetch the actual video bytes using the key
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

/**
 * Generates speech using gemini-2.5-flash-preview-tts.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) {
    throw new Error("No audio data received");
  }
  return audioData;
};