import { SocialIdea } from '../types';

export const SocialService = {
  /**
   * Generates the "Maxed 4" core ideas based on a topic.
   * 
   * DEVELOPER HANDOFF NOTE:
   * This mock service simulates the output of the GeminiContentService.
   * When integrating the real AI, ensure the prompt instructs the model
   * to strictly return these 4 categories (Hook, Educator, Emotion, Contrast)
   * but DO NOT expose the category labels to the frontend UI string.
   */
  getCoreIdeas: async (topic: string): Promise<SocialIdea[]> => {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 800));

    // Fallback if topic is empty, ensuring no "undefined" text in UI
    const cleanTopic = topic.trim() || "your product";

    return [
      {
        id: 'idea-1',
        category: 'Hook/Trend',
        title: 'The Scroll Stopper',
        description: `Create a 5-second video hook showcasing ${cleanTopic} in action. Use quick cuts and high-contrast lighting to grab immediate visual attention, focusing on the unique design or key outcome.`
      },
      {
        id: 'idea-2',
        category: 'Educator/Technical',
        title: 'The Expert Breakdown',
        description: `Deep dive into the specific features of ${cleanTopic}. Explain the "how" and "why" behind its design, positioning your brand as the technical authority in the space.`
      },
      {
        id: 'idea-3',
        category: 'Emotional/Fantasy',
        title: 'The Dream State',
        description: `Don't just sell ${cleanTopic}; sell the result. Describe the feeling of using it to achieve a perfect outcome, linking the features to the emotional satisfaction of the user.`
      },
      {
        id: 'idea-4',
        category: 'Contrast/Why Us',
        title: 'The Competitor Contrast',
        description: `Position ${cleanTopic} side-by-side with the industry standard or previous versions. Highlight the specific pain points this new version solves that others miss.`
      }
    ];
  }
};