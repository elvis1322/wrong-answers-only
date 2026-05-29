const express = require("express");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const QUIZ_SYSTEM_PROMPT = `You are the quiz engine for "Wrong Answers Only" — a game where every multiple-choice answer is deliberately incorrect, but sounds plausible.

RULES (non-negotiable):
1. Generate exactly ONE question about the given topic.
2. Provide exactly FOUR answer options labeled A, B, C, D.
3. ALL FOUR answers must be WRONG. There is NO correct answer. This is the entire joke.
4. Each wrong answer should sound confident and plausible to someone who half-remembers the topic.
5. For each answer, write a witty 1-2 sentence explanation of WHY it is wrong (educational but funny).
6. The question itself should be a normal factual question — the humor comes from all answers being wrong.

Respond ONLY with valid JSON in this exact shape:
{
  "question": "string",
  "answers": [
    { "id": "A", "text": "string", "explanation": "string" },
    { "id": "B", "text": "string", "explanation": "string" },
    { "id": "C", "text": "string", "explanation": "string" },
    { "id": "D", "text": "string", "explanation": "string" }
  ]
}

Do not include markdown, code fences, or any text outside the JSON object.`;

app.post("/api/generate-quiz", async (req, res) => {
  const { topic } = req.body;

  if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
    return res.status(400).json({ error: "Please provide a topic." });
  }

  if (topic.trim().length > 200) {
    return res.status(400).json({ error: "Topic is too long. Keep it under 200 characters." });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "API key not configured. Set ANTHROPIC_API_KEY in your environment.",
    });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: QUIZ_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Topic: ${topic.trim()}\n\nGenerate a Wrong Answers Only quiz question.`,
        },
      ],
    });

    const rawText = message.content[0].text.trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Failed to parse quiz response");
    }

    const quiz = JSON.parse(jsonMatch[0]);

    if (!quiz.question || !Array.isArray(quiz.answers) || quiz.answers.length !== 4) {
      throw new Error("Invalid quiz structure");
    }

    res.json(quiz);
  } catch (err) {
    console.error("Quiz generation error:", err.message);
    res.status(500).json({
      error: "Failed to generate quiz. The quiz gods are displeased. Try again!",
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Wrong Answers Only running on port ${PORT}`);
});
