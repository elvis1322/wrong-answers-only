require("dotenv").config();
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

const STYLE_PROMPTS = {
  sarcastic: "sarcastic scholar (dripping with dry wit, intellectual arrogance, and playful condescension)",
  pirate: "swashbuckling pirate (speaks in pirate lingo, references sea monsters, peglegs, treasure maps, and grog, starting sentences with 'Ahoy!' or 'Avast!' and using phrases like 'Ye scallywag!')",
  corporate: "corporate executive (uses buzzwords like synergy, alignment, paradigms, moving the needle, circles back, bandwidth, low-hanging fruit, and taking it offline)",
  genz: "Gen-Z influencer (dripping in slang like 'no cap', 'rizz', 'sigma', 'fr fr', 'bruh', using chaotic, dramatic abbreviations, and sounding entirely unserious)",
  shakespeare: "Shakespearean bard (written in high-drama Elizabethan English, 'thou', 'thee', 'doth', 'fie!', filled with poetic tragedies and theatrical sighs)"
};

function getSystemPrompt(style = "sarcastic") {
  const styleDescription = STYLE_PROMPTS[style] || STYLE_PROMPTS.sarcastic;
  return `You are the quiz engine for "Wrong Answers Only" — a game where every multiple-choice answer is deliberately incorrect, but sounds plausible.

RULES (non-negotiable):
1. Generate exactly ONE question about the given topic.
2. Provide exactly FOUR answer options labeled A, B, C, D.
3. ALL FOUR answers must be WRONG. There is NO correct answer. This is the entire joke.
4. Each wrong answer should sound confident and plausible to someone who half-remembers the topic.
5. For each answer, write a witty 1-2 sentence explanation of WHY it is wrong.
6. The question itself should be a normal factual question — the humor comes from all answers being wrong.
7. CRITICAL: The explanation for WHY it is wrong must be written in the persona/style of a ${styleDescription}.

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
}

app.post("/api/generate-quiz", async (req, res) => {
  const { topic, style } = req.body;

  if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
    return res.status(400).json({ error: "Please provide a topic." });
  }

  if (topic.trim().length > 200) {
    return res.status(400).json({ error: "Topic is too long. Keep it under 200 characters." });
  }

  const selectedStyle = (style && typeof style === "string") ? style.toLowerCase() : "sarcastic";

  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

  if (!hasGemini && !hasAnthropic) {
    return res.status(500).json({
      error: "No API keys configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY in your environment.",
    });
  }

  try {
    let rawText = "";

    if (hasGemini) {
      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `Topic: ${topic.trim()}\n\nGenerate a Wrong Answers Only quiz question using the selected explanation style.` }]
            }
          ],
          systemInstruction: {
            parts: [{ text: getSystemPrompt(selectedStyle) }]
          },
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1024,
        system: getSystemPrompt(selectedStyle),
        messages: [
          {
            role: "user",
            content: `Topic: ${topic.trim()}\n\nGenerate a Wrong Answers Only quiz question using the selected explanation style.`,
          },
        ],
      });
      rawText = message.content[0].text.trim();
    }

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
      error: `Failed to generate quiz: ${err.message}. Try again!`,
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    activeProvider: process.env.GEMINI_API_KEY ? "Gemini" : (process.env.ANTHROPIC_API_KEY ? "Anthropic" : "None")
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Wrong Answers Only running on port ${PORT}`);
});
