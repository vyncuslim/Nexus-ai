import { ChatMessage, Role } from "../types";

/**
 * Service to interact with OpenAI API.
 * Replaces the previous Gemini implementation.
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

const getHeaders = (apiKey: string) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${apiKey}`
});

/**
 * Streams text response from OpenAI (ChatGPT).
 */
export const streamGeminiResponse = async (
  modelId: string,
  history: ChatMessage[],
  newMessage: string,
  systemInstruction: string,
  onChunk: (text: string) => void,
  apiKey?: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");

  const messages = [
    { role: "system", content: systemInstruction },
    ...history.map(m => ({ role: m.role === Role.USER ? "user" : "assistant", content: m.text })),
    { role: "user", content: newMessage }
  ];

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: getHeaders(apiKey),
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
          } catch (e) {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }

    return fullText;

  } catch (error) {
    console.error("OpenAI Text Service Error:", error);
    throw error;
  }
};

/**
 * Generates an image using DALL-E 3.
 */
export const generateImage = async (prompt: string, imageSize: string = "1024x1024", apiKey?: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");

  // OpenAI supports 1024x1024 standard for DALL-E 3
  const size = "1024x1024"; 

  const response = await fetch(OPENAI_IMAGE_URL, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size,
      response_format: "b64_json"
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Image Gen Error");
  }

  const data = await response.json();
  const b64 = data.data[0].b64_json;
  return `data:image/png;base64,${b64}`;
};

/**
 * Placeholder for Video - OpenAI doesn't have public Video API yet.
 */
export const generateVideo = async (prompt: string, aspectRatio: string = "16:9", apiKey?: string): Promise<string> => {
  throw new Error("Video generation is not currently supported by this OpenAI integration.");
};

/**
 * Generates speech using OpenAI TTS.
 */
export const generateSpeech = async (text: string, apiKey?: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");

  const response = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice: "alloy"
    })
  });

  if (!response.ok) throw new Error("TTS Error");

  const blob = await response.blob();
  
  // Convert blob to base64
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