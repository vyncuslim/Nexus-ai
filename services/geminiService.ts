import { ChatMessage, Role, AIProvider, ModelConfig, GroundingMetadata } from "../types";
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { DATABASE_TOOLS } from "../constants";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface GenerationOptions {
  useSearch?: boolean;
  thinkingBudget?: number;
  maxOutputTokens?: number;
  temperature?: number;
  tools?: any[];
}

interface StreamResult {
  text: string;
  groundingMetadata?: GroundingMetadata;
  functionCalls?: any[];
}

export const streamGeminiResponse = async (
  model: ModelConfig,
  history: ChatMessage[],
  newMessage: string,
  systemInstruction: string,
  onChunk: (text: string) => void,
  apiKey?: string,
  options: GenerationOptions = {}
): Promise<StreamResult> => {
  if (model.provider === 'google') {
    return streamGoogleResponse(model.id, history, newMessage, systemInstruction, onChunk, apiKey, options);
  }

  if (!apiKey) throw new Error(`API Key missing for ${model.provider}`);

  if (model.provider === 'anthropic') {
    const text = await streamAnthropicResponse(model.id, history, newMessage, systemInstruction, onChunk, apiKey, options);
    return { text };
  }

  let url = OPENAI_API_URL;
  if (model.provider === 'deepseek') url = DEEPSEEK_API_URL;
  if (model.provider === 'grok') url = GROK_API_URL;
    
  const text = await streamOpenAICompatibleResponse(url, model.id, history, newMessage, systemInstruction, onChunk, apiKey, options);
  return { text };
};

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
    ...history.map(m => ({ role: m.role === Role.USER ? "user" as const : "assistant" as const, content: m.text })),
    { role: "user" as const, content: newMessage }
  ];

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: modelId,
      system: systemInstruction,
      messages: messages,
      stream: true,
      max_tokens: options.maxOutputTokens || 4096,
      temperature: options.temperature
    })
  });

  if (!response.ok) throw new Error(`Anthropic API Error: ${response.status}`);
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
          if (json.type === 'content_block_delta') {
            const content = json.delta?.text || "";
            fullText += content;
            onChunk(fullText);
          }
        } catch (e) {}
      }
    }
  }
  return fullText;
};

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

  if (!response.ok) throw new Error(`AI Provider API Error: ${response.status}`);
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
        } catch (e) {}
      }
    }
  }
  return fullText;
};

const streamGoogleResponse = async (
  modelId: string,
  history: ChatMessage[],
  newMessage: string,
  systemInstruction: string,
  onChunk: (text: string) => void,
  apiKey?: string,
  options: GenerationOptions = {}
): Promise<StreamResult> => {
  if (!apiKey) throw new Error("Google Gemini API Key is missing. Please set it in Settings.");
  const ai = new GoogleGenAI({ apiKey });
  
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
    if (!config.maxOutputTokens) config.maxOutputTokens = options.thinkingBudget + 2048;
  }

  const tools = [];
  if (options.useSearch) tools.push({ googleSearch: {} });
  if (options.tools) tools.push({ functionDeclarations: options.tools });
  if (tools.length > 0) config.tools = tools;

  const chat = ai.chats.create({
    model: modelId,
    history: googleHistory,
    config: config
  });

  const result = await chat.sendMessageStream({ message: newMessage });
  
  let fullText = "";
  let groundingMetadata: GroundingMetadata | undefined;
  let functionCalls: any[] | undefined;

  for await (const chunk of result) {
    const c = chunk as GenerateContentResponse;
    const text = c.text;
    if (text) {
      fullText += text;
      onChunk(fullText);
    }
    
    if (c.candidates?.[0]?.groundingMetadata) {
      groundingMetadata = c.candidates[0].groundingMetadata as GroundingMetadata;
    }

    if (c.functionCalls) {
      functionCalls = c.functionCalls;
    }
  }

  return { text: fullText, groundingMetadata, functionCalls };
};

export const generateSpeech = async (text: string, apiKey?: string, provider: AIProvider = 'google'): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing for voice synthesis.");
  const ai = new GoogleGenAI({ apiKey });
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