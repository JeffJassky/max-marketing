import { GoogleGenAI } from "@google/genai";
import { BrandVoiceData } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing from environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateNarrative = async (data: BrandVoiceData): Promise<string> => {
  try {
    const ai = getClient();
    
    // Construct a prompt based on the current data state
    const prompt = `
      Analyze the following Brand Voice Index (BVI) data for "George's Music" and write a concise, professional executive summary (max 80 words).
      
      Current BVI: ${data.bvi.value} (Trend: ${data.bvi.trend}, Change: ${data.bvi.percentageChange}%)
      
      Sub-Scores:
      - Search (27% weight): ${data.subScores.search.score}
      - Social (33% weight): ${data.subScores.social.score}
      - Reviews (10% weight): ${data.subScores.reviews.score}
      - Website (30% weight): ${data.subScores.website.score}
      
      Key Stats:
      - Total Search Velocity: ${data.deepDive.totalSearchVelocity.value}
      - Social Views: ${data.deepDive.socialViews.value}
      
      Focus on the correlation between social engagement and the overall index.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using efficient model for text generation
      contents: prompt,
      config: {
        maxOutputTokens: 200,
        temperature: 0.7,
      }
    });

    return response.text || "Unable to generate narrative at this time.";
  } catch (error) {
    console.error("Error generating narrative:", error);
    // Fallback message if API fails (or key is missing in demo env)
    return "AI Narrative generation unavailable. Please check API Key configuration.";
  }
};
