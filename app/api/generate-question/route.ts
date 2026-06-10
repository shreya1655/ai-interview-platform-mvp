export async function POST(request: Request) {
  try {
    const { role, level, resume, previousQuestions } = await request.json();

    if (!role) {
      return Response.json({ error: "Role is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY is missing from .env.local" },
        { status: 500 }
      );
    }

    const prompt = `
You are a strict but helpful technical interviewer.

Generate exactly ONE realistic interview question.

Target role: ${role}
Candidate level: ${level || "Intern"}

Candidate resume and project context:
${resume || "No resume context was provided."}

Questions already asked:
${(previousQuestions || []).join("\n") || "None"}

Rules:
- Ask only one question.
- Do not provide an answer.
- Prefer a question connected to the candidate's projects.
- Ask questions suitable for an internship or entry-level interview.
- Avoid repeating any previous question.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data?.error?.message || "Gemini API request failed" },
        { status: response.status }
      );
    }

    const question =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Explain your strongest project and the technical decisions behind it.";

    return Response.json({ question });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}