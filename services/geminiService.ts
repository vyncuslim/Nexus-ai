
import { ChatMessage, Role, AIProvider, ModelConfig, GroundingMetadata } from "../types";
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Unified AI Service
 * Supports OpenAI, Google Gemini, Anthropic, DeepSeek, and Grok
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const getHeaders = (apiKey: string, provider: AIProvider) => {
  const headers: any = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  };
  return headers;
};

interface GenerationOptions {
  useSearch?: boolean;
  thinkingBudget?: number;
  maxOutputTokens?: number;
  temperature?: number;
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
  // Always use process.env.API_KEY for Google provider
  if (model.provider === 'google') {
    return streamGoogleResponse(model.id, history, newMessage, systemInstruction, onChunk, options);
  }

  if (!apiKey) throw new Error(`API Key missing for ${model.provider}`);

  if (model.provider === 'openai' || model.provider === 'codex' || model.provider === 'deepseek' || model.provider === 'grok') {
    let url = OPENAI_API_URL;
    if (model.provider === 'deepseek') url = DEEPSEEK_API_URL;
    if (model.provider === 'grok') url = GROK_API_URL;
    
    const text = await streamOpenAICompatibleResponse(url, model.id, history, newMessage, systemInstruction, onChunk, apiKey, options);
    return { text };
  } 
  else if (model.provider === 'anthropic') {
    const text = await streamAnthropicResponse(model.id, history, newMessage, systemInstruction, onChunk, apiKey, options);
    return { text };
  } 
  else {
    throw new Error(`Unsupported provider: ${model.provider}`);
  }
};

/**
 * OpenAI-Compatible Implementation (OpenAI, DeepSeek, Grok)
 */
const streamOpenAICompatibleResponse = async (
  url: string,
  modelId: string,
  history: ChatMessage[],
  newMessage: string,
  systemInstruction: string,
  onChunk: (text: string) => void,
  apiKey: string,
  options: GenerationOptions
): Promise<string> => {
  const messages = [
    { role: "system", content: systemInstruction },
    ...history.map(m => ({ role: m.role === Role.USER ? "user" : "assistant", content: m.text })),
    { role: "user", content: newMessage }
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages,
      stream: true,
      temperature: options.temperature,
      max_tokens: options.maxOutputTokens
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "AI Provider API Error");
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
 * Anthropic Implementation
 */
const streamAnthropicResponse = async (
  modelId: string,
  history: ChatMessage[],
  newMessage: string,
  systemInstruction: string,
  onChunk: (text: string) => void,
  apiKey: string,
  options: GenerationOptions
): Promise<string> => {
  const messages = [
    ...history.map(m => ({ role: m.role === Role.USER ? "user" : "assistant", content: m.text })),
    { role: "user", content: newMessage }
  ];

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerously-allow-browser": "true" 
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages,
      system: systemInstruction,
      stream: true,
      max_tokens: options.maxOutputTokens || 4096,
      temperature: options.temperature
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Anthropic API Error");
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
      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          if (json.type === 'content_block_delta' && json.delta?.text) {
             const textPart = json.delta.text;
             fullText += textPart;
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
  // Initialize GoogleGenAI exclusively with process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const googleHistory = history.map(msg => ({
    role: msg.role === Role.USER ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  const config: any = { 
    systemInstruction,
    temperature: options.temperature,
    maxOutputTokens: options.maxOutputTokens,
  };

  if (options.thinkingBudget && options.thinkingBudget > 0) {
    config.thinkingConfig = { thinkingBudget: options.thinkingBudget };
    // Ensure maxOutputTokens is set and larger than thinking budget if needed
    if (!config.maxOutputTokens) config.maxOutputTokens = options.thinkingBudget + 2048;
  }

  if (options.useSearch) {
    config.tools = [{ googleSearch: {} }];
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
    
    const candidate = chunk.candidates?.[0];
    if (candidate?.groundingMetadata) {
      groundingMetadata = candidate.groundingMetadata as GroundingMetadata;
    }
  }

  return { text: fullText, groundingMetadata };
};

export const generateSpeech = async (text: string, apiKey?: string, provider: AIProvider = 'google'): Promise<string> => {
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
  if (!audioData) throw new Error("Voice synthesis failure");
  return audioData;
};
