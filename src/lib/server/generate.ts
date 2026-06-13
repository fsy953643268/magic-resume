import { ProxyAgent, setGlobalDispatcher } from "undici";
import { AI_MODEL_CONFIGS, AIModelType } from "@/config/ai";

let proxyDispatcherInitialized = false;

const ensureProxyDispatcher = () => {
  if (proxyDispatcherInitialized) return;
  const proxyUrl =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;
  if (!proxyUrl) {
    proxyDispatcherInitialized = true;
    return;
  }
  try {
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
  } catch (error) {
    console.warn("Failed to initialize proxy dispatcher:", error);
  } finally {
    proxyDispatcherInitialized = true;
  }
};

export interface GenerateContentParams {
  provider: AIModelType;
  apiKey: string;
  modelId: string;
  systemInstruction: string;
  userContent: string;
  images?: Array<{ mimeType: string; base64Data: string }>;
  temperature?: number;
  apiEndpoint?: string;
}

export interface GenerateContentResult {
  text: string;
}

// Gemini SDK
const generateWithGemini = async (params: GenerateContentParams): Promise<GenerateContentResult> => {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  ensureProxyDispatcher();
  const genAI = new GoogleGenerativeAI(params.apiKey);
  const model = genAI.getGenerativeModel({
    model: params.modelId,
    systemInstruction: params.systemInstruction,
    generationConfig: {
      temperature: params.temperature ?? 0.2,
      responseMimeType: "application/json",
    },
  });
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: params.userContent },
  ];
  if (params.images) {
    parts.push(...params.images.map((img) => ({
      inlineData: { mimeType: img.mimeType, data: img.base64Data },
    })));
  }
  const result = await model.generateContent(parts);
  return { text: result.response.text() };
};

// OpenAI-compatible (covers doubao, deepseek, openai)
const generateWithOpenAICompat = async (params: GenerateContentParams): Promise<GenerateContentResult> => {
  ensureProxyDispatcher();
  const config = AI_MODEL_CONFIGS[params.provider];
  const baseUrl = params.provider === "openai" || params.provider === "custom"
    ? config.url(params.apiEndpoint)
    : config.url();
  const headers: Record<string, string> = {
    ...config.headers(params.apiKey),
  };

  const body: Record<string, unknown> = {
    model: params.modelId,
    messages: [
      { role: "system", content: params.systemInstruction },
      {
        role: "user",
        content: params.images && params.images.length > 0
          ? [
              { type: "text", text: params.userContent },
              ...params.images.map((img) => ({
                type: "image_url",
                image_url: {
                  url: `data:${img.mimeType};base64,${img.base64Data}`,
                },
              })),
            ]
          : params.userContent,
      },
    ],
    temperature: params.temperature ?? 0.2,
  };

  const response = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("API returned no content");
  }
  return { text };
};

export const generateContent = async (params: GenerateContentParams): Promise<GenerateContentResult> => {
  if (params.provider === "gemini") {
    return generateWithGemini(params);
  }
  return generateWithOpenAICompat(params);
};
