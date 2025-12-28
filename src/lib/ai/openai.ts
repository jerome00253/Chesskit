import OpenAI from "openai";

const API_KEY = process.env.OPENAI_API_KEY;

export async function generateGameAnalysis(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("OPENAI_API_KEY is not defined in environment variables.");
  }

  const openai = new OpenAI({
    apiKey: API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini", // Optimized for cost and speed
    });

    const text = completion.choices[0].message.content;

    if (!text) {
        throw new Error("No content received from OpenAI.");
    }
    
    return text;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to generate analysis with OpenAI.");
  }
}
