import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage, Role } from "../types";

// Initialize the client strictly using the environment variable as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Creates a chat session and returns a stream of responses.
 * @param modelId The model identifier to use.
 * @param history Previous messages to build context.
 * @param newMessage The current user message.
 * @param systemInstruction The system prompt to use (based on language).
 * @param onChunk Callback for each streaming chunk.
 * @returns The full generated text after completion.
 */
export const streamGeminiResponse = async (
  modelId: string,
  history: ChatMessage[],
  newMessage: string,
  systemInstruction: string,
  onChunk: (text: string) => void
): Promise<string> => {
  try {
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
    console.error("Gemini Service Error:", error);
    throw error;
  }
};