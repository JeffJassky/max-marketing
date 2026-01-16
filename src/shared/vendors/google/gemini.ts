import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateContent(
  prompt: string,
  modelName = "gemini-flash-latest"
) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateStructuredContent<T>(
  prompt: string,
  modelName = "gemini-flash-latest"
) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text()) as T;
}
