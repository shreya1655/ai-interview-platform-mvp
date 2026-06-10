export async function POST(request: Request) {
  try {
    const { role, question, answer } = await request.json();

    if (!question || !answer) {
      return Response.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
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
You are an expert software engineering interviewer.

Evaluate this candidate's interview answer.

Target role: ${role}
Interview question: ${question}

Candidate answer:
${answer}

Give honest and specific feedback.

Return the answer in exactly this format:

Score: X/10

Strengths:
- ...

Weaknesses:
- ...

Technical Depth Check:
- ...

Communication Feedback:
- ...

Improved Answer:
...

Next Practice Question:
...
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

    const feedback =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Could not generate feedback.";

    const scoreMatch = feedback.match(/Score:\s*(\d+)/i);
    const score = scoreMatch ? Number(scoreMatch[1]) : null;

    return Response.json({ score, feedback });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}