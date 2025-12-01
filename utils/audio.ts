// Audio Utility to handle Raw PCM data (Gemini) and MP3 (OpenAI)

let audioContext: AudioContext | null = null;

export const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ 
      sampleRate: 24000 
    });
  }
  return audioContext;
};

function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Manual PCM 16-bit decode (Fallback for Gemini)
async function decodePCM(
  arrayBuffer: ArrayBuffer,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(arrayBuffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert 16-bit PCM to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playAudioContent = async (base64Audio: string): Promise<AudioBufferSourceNode> => {
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const arrayBuffer = base64ToArrayBuffer(base64Audio);
  
  let audioBuffer: AudioBuffer;

  try {
    // 1. Try Native Decode (Works for MP3/WAV from OpenAI)
    // We clone the buffer because decodeAudioData detaches it
    const tempBuffer = arrayBuffer.slice(0);
    audioBuffer = await ctx.decodeAudioData(tempBuffer);
  } catch (e) {
    // 2. Fallback to Manual PCM Decode (Works for Gemini Raw Audio)
    // Gemini returns raw PCM 24kHz which native decodeAudioData often fails on
    // console.log("Native decode failed, attempting PCM decode...", e);
    audioBuffer = await decodePCM(arrayBuffer, ctx);
  }
  
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  source.start();
  
  return source;
};