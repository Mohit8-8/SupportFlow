import "dotenv/config";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Define a strict structure matching what our system expects
interface AITriageResult {
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  suggestedResponse: string;
}

export const analyzeTicketWithAI = async (
  title: string,
  description: string
): Promise<AITriageResult> => {
  // === FALLBACK MECHANISM ===
  // If the API key is missing, immediately drop back to a safe default instead of crashing
  if (!GEMINI_API_KEY) {
    console.warn("⚠️ AI Warning: GEMINI_API_KEY is not configured. Using fallback defaults.");
    return {
      category: "General Support",
      priority: "MEDIUM",
      suggestedResponse: "Thank you for reaching out. A support agent will review your request shortly.",
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Craft a strict prompt forcing the LLM to output ONLY raw, structured JSON
  const prompt = `
    You are an advanced AI support ticket classification engine.
    Analyze the following customer support ticket and return a JSON object.
    
    Ticket Title: "${title}"
    Ticket Description: "${description}"
    
    Your response must follow this JSON schema exactly:
    {
      "category": "A short category name like 'Billing', 'Technical Issue', 'Account Access', or 'Feature Request'",
      "priority": "Must be exactly one of these strings: 'LOW', 'MEDIUM', 'HIGH', or 'CRITICAL'",
      "suggestedResponse": "A professional, empathetic draft response addressing the customer's issue."
    }
    
    CRITICAL: Return ONLY valid JSON. Do not include markdown code blocks, backticks, or extra conversational text.
  `;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    // Parse the string into a real JavaScript Object
    const parsedData: AITriageResult = JSON.parse(rawText);

    // Final safety validation to guarantee the priority string strictly matches our Prisma Enum
    const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const fixedPriority = validPriorities.includes(parsedData.priority) ? parsedData.priority : "MEDIUM";

    return {
      category: parsedData.category || "General Support",
      priority: fixedPriority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      suggestedResponse: parsedData.suggestedResponse || "We are reviewing your ticket.",
    };

  } catch (error) {
    // === GRACEFUL FALLBACK ERRORS ===
    console.error("❌ AI Triage Error, falling back to defaults:", error);
    return {
      category: "Technical Issue",
      priority: "HIGH", // Play it safe on failure by bumping priority to human review
      suggestedResponse: "We are experiencing technical difficulties generating an automated draft, but an agent has been notified.",
    };
  }
};