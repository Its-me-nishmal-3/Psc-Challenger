const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateQuestions = async (topic, count = 5, difficulty = 'medium') => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Generate ${count} multiple choice questions on the topic "${topic}" with difficulty level "${difficulty}".
        
        CRITICAL: The output must be a strict JSON array. Each object in the array must match this schema exactly:
        
        {
          "question": {
            "en": "Question in English",
            "ml": "Question in Malayalam (translate accurately)"
          },
          "options": [
            { "en": "Option 1 En", "ml": "Option 1 Ml" },
            { "en": "Option 2 En", "ml": "Option 2 Ml" },
            { "en": "Option 3 En", "ml": "Option 3 Ml" },
            { "en": "Option 4 En", "ml": "Option 4 Ml" }
          ],
          "correctAnswerIndex": 0, // Integer 0-3 indicating the index of the correct option
          "topic": "${topic}",
          "difficulty": "${difficulty}",
          "source": "ai"
        }

        Provide ONLY the JSON array. Do not include markdown formatting (like \`\`\`json). Do not include any introductory text.
        `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up markdown if present (just in case)
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate questions");
  }
};

module.exports = { generateQuestions };
