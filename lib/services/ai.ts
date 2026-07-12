export interface AIGradingResult {
  score: number;
  feedback: string;
}

export async function gradeApplication(answers: any): Promise<AIGradingResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY is not set. Skipping actual AI grading.");
    return {
      score: 50,
      feedback: "API Key missing. Default fallback grade applied.",
    };
  }

  try {
    const prompt = `
    You are an expert HR recruiter for a top-tier technical student club. 
    Please evaluate the following application answers and provide a score out of 100, 
    along with a brief 2-3 sentence feedback summary detailing strengths and weaknesses.
    
    Applicant Answers:
    ${JSON.stringify(answers, null, 2)}
    
    Return your response strictly in the following JSON format:
    {
      "score": <integer from 0 to 100>,
      "feedback": "<string summary>"
    }
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "STC OS",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-free",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return {
      score: parsed.score || 0,
      feedback: parsed.feedback || "No feedback provided.",
    };
  } catch (error) {
    console.error("Failed to grade application:", error);
    return {
      score: 0,
      feedback: "AI Grading Failed due to a system error.",
    };
  }
}
