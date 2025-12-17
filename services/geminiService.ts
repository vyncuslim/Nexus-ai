import { ChatMessage, Role, AIProvider, ModelConfig, GroundingMetadata } from "../types";
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Unified AI Service
 * Supports both OpenAI (via Fetch) and Google Gemini (via SDK).
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

const getOpenAIHeaders = (apiKey: string) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${apiKey}`
});

interface GenerationOptions {
  useSearch?: boolean;
  useThinking?: boolean;
}

interface StreamResult {
  text: string;
  groundingMetadata?: GroundingMetadata;
}

/**
 * Stream Response (Unified)
 */
export const streamGeminiResponse = async (
  model: ModelConfig,
  history: ChatMessage[],
  newMessage: string,
  systemInstruction: string,
  onChunk: (text: string) => void,
  apiKey?: string,
  options: GenerationOptions = {}
): Promise<StreamResult> => {
  if (model.provider === 'openai') {
    if (!apiKey) throw new Error("API Key missing for OpenAI");
    const text = await streamOpenAIResponse(model.id, history, newMessage, systemInstruction, onChunk, apiKey);
    return { text };
  } else {
    // Google uses process.env.API_KEY directly
    return streamGoogleResponse(model.id, history, newMessage, systemInstruction, onChunk, options);
  }
};

/**
 * OpenAI Implementation
 */
const streamOpenAIResponse = async (
  modelId: string,
  history: ChatMessage[],
  newMessage: string,
  systemInstruction: string,
  onChunk: (text: string) => void,
  apiKey: string
): Promise<string> => {
  const messages = [
    { role: "system", content: systemInstruction },
    ...history.map(m => ({ role: m.role === Role.USER ? "user" : "assistant", content: m.text })),
    { role: "user", content: newMessage }
  ];

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: getOpenAIHeaders(apiKey),
    body: JSON.stringify({
      model: modelId,
      messages: messages,
      stream: true
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "OpenAI API Error");
  }

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === "data: [DONE]") break;
      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices[0]?.delta?.content || "";
          if (content) {
            fullText += content;
            onChunk(fullText);
          }
        } catch (e) { /* ignore */ }
      }
    }
  }
  return fullText;
};

/**
 * Google Gemini Implementation
 */
const streamGoogleResponse = async (
  modelId: string,
  history: ChatMessage[],
  newMessage: string,
  systemInstruction: string,
  onChunk: (text: string) => void,
  options: GenerationOptions
): Promise<StreamResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Transform history to Google format
  const googleHistory = history.map(msg => ({
    role: msg.role === Role.USER ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  const config: any = { 
    systemInstruction,
  };

  // 1. Thinking Config
  if (options.useThinking) {
    // Only 2.5 series supports thinking config properly in this context usually, 
    // or specific thinking models.
    // The prompt says "gemini-3-pro-preview" supports 32768, 2.5 flash 24576.
    // We'll set a safe budget if the user explicitly asks for thinking.
    // Note: thinkingConfig is only available for 2.5 series and 3-pro per docs provided.
    if (modelId.includes('gemini-2.5') || modelId.includes('gemini-3')) {
       config.thinkingConfig = { thinkingBudget: 1024 * 4 }; // 4k tokens for reasoning
    }
  }

  // 2. Tools (Search)
  if (options.useSearch) {
    config.tools = [{ googleSearch: {} }];
    // Google Search cannot be used with responseMimeType/Schema
  }

  const chat = ai.chats.create({
    model: modelId,
    history: googleHistory,
    config: config
  });

  const result = await chat.sendMessageStream({ message: newMessage });
  
  let fullText = "";
  let groundingMetadata: GroundingMetadata | undefined;

  for await (const chunk of result) {
    const text = chunk.text;
    if (text) {
      fullText += text;
      onChunk(fullText);
    }
    
    // Check for grounding metadata in chunks
    // The SDK types might require casting or checking properties loosely if not perfectly typed yet
    const candidate = chunk.candidates?.[0];
    if (candidate?.groundingMetadata) {
      groundingMetadata = candidate.groundingMetadata as GroundingMetadata;
    }
  }

  return { text: fullText, groundingMetadata };
};

/**
 * Image Generation (Unified)
 */
export const generateImage = async (
  model: ModelConfig,
  prompt: string, 
  imageSize: string = "1024x1024", 
  apiKey?: string
): Promise<string> => {
  if (model.provider === 'openai') {
    if (!apiKey) throw new Error("API Key missing for OpenAI");
    // DALL-E 3
    const response = await fetch(OPENAI_IMAGE_URL, {
      method: "POST",
      headers: getOpenAIHeaders(apiKey),
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024", // OpenAI standard
        response_format: "b64_json"
      })
    });
    if (!response.ok) throw new Error("OpenAI Image Error");
    const data = await response.json();
    return `data:image/png;base64,${data.data[0].b64_json}`;

  } else {
    // Gemini Image
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Map simplified size to Google config if needed, or default
    const config: any = {
      imageConfig: { imageSize: "1K" } // forcing 1K for now as 2K/4K is specific to Pro
    };
    if (imageSize === "2K") config.imageConfig.imageSize = "2K";
    // if (imageSize === "4K") config.imageConfig.imageSize = "4K"; // Only if model supports it

    const response = await ai.models.generateContent({
      model: model.id,
      contents: { parts: [{ text: prompt }] },
      config: config
    });
    
    // Find image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) {
         return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
       }
    }
    throw new Error("No image generated by Gemini");
  }
};

/**
 * Video Generation (Google Only)
 */
export const generateVideo = async (
  model: ModelConfig,
  prompt: string, 
  aspectRatio: string = "16:9", 
  apiKey?: string
): Promise<string> => {
  // if (model.provider === 'openai') throw new Error("OpenAI does not support Video generation yet.");
  // Ignore apiKey arg, use env
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let operation = await ai.models.generateVideos({
    model: model.id,
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio === '16:9' ? '16:9' : '9:16'
    }
  });

  // Polling
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");

  // Fetch the actual bytes using the key
  const res = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

/**
 * Speech Generation (Unified)
 */
export const generateSpeech = async (text: string, apiKey?: string, provider: AIProvider = 'google'): Promise<string> => {
  if (provider === 'openai') {
    if (!apiKey) throw new Error("API Key missing for OpenAI");
    const response = await fetch(OPENAI_TTS_URL, {
      method: "POST",
      headers: getOpenAIHeaders(apiKey),
      body: JSON.stringify({ model: "tts-1", input: text, voice: "alloy" })
    });
    if (!response.ok) throw new Error("OpenAI TTS failed");
    const blob = await response.blob();
    return blobToBase64(blob);
  } else {
    // Google TTS
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("Gemini TTS returned no audio data");
    return audioData;
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};