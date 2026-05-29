# 🚫 Wrong Answers Only (Premium Edition)

A quiz game where **every answer is wrong — on purpose**. Type any topic you can think of (e.g., *Ancient Rome*, *JavaScript*, *Your ex's favorite band*) and get a normal factual question paired with four extremely confident, highly plausible, but completely incorrect answers. 

Pick your favorite mistake and get a witty, hilarious explanation of why it is wrong!

Built as a submission for the **Solution25 Applied AI Engineer Internship Task**.

---

## ✨ Features & Thoughtful Touches

This premium version is packed with details that show deep care for user experience, design aesthetics, and technical polish:

1. **🎭 Customizable Explanation Styles**: Select from five distinct AI personas to customize how Claude explains your mistakes:
   * 🎙️ **Sarcastic Scholar**: Dripping with dry wit, intellectual arrogance, and playful condescension.
   * 🏴‍☠️ **Swashbuckling Pirate**: Speaks in pirate slang, references sea monsters, treasure maps, and peglegs.
   * 👔 **Corporate Executive**: Overloads you with buzzwords like *synergy*, *alignment*, *low-hanging fruit*, and *taking it offline*.
   * 💀 **Gen-Z Influencer**: Full of dramatic slang like *no cap*, *rizz*, *sigma*, *fr fr*, *bruh*, and *entirely unserious* vibes.
   * 🎭 **Shakespearean Bard**: Written in high-drama Elizabethan English (*thou*, *thee*, *doth*) and theatrical sighs.
2. **🔊 Web Audio API Retro Synthesizer**: Procedural, lightweight sound effects synthesized directly in the browser (no external files or bulky audio assets):
   * *Rising major third arpeggio* on normal answers.
   * *Satisfying chord progression* on high streaks.
   * *Low warning buzz* on API or topic errors.
   * *Cozy intro chord* that warms up on the first user interaction.
   * A clean, floating **Sound Mute Toggle** with custom SVGs that persists your mute preference in `localStorage`.
3. **🔥 Extended Gamification**: A complete statistics tracking engine stored in `localStorage`:
   * Current Wrong Answer **Streak**.
   * Record **High Streak**.
   * Total **Wrong Answers Selected** (Score).
   * **Total Plays** count.
   * A **Glowing Fire Emoji** that lights up and dances when your streak is 3 or more.
4. **🎉 Self-Cleaning Confetti Particle Engine**: A pure CSS/JS particle engine that triggers neon falling dots when a player hits streak milestones (3+), without external canvas libraries.
5. **📋 Clipboard Share Cards**: A one-click **Share Roast** button that formats your question, selected wrong answer, Claude's explanation, and current streak into an elegant text template perfect for Twitter, Slack, or Discord.
6. **🎨 Sleek Glassmorphic Aesthetics**: Modern dark mode built with HSL color tokens, neon glowing outlines, frosted glass panels (`backdrop-filter: blur`), responsive grids, slide-in card entries, and subtle noise filters.
7. **🌀 Rotating Loading Messages**: "Consulting the wrong oracle...", "Fact-checking in reverse...", and other playful, rotating prompts while Claude builds the quiz.

---

## ⚡ Quick Start (Under 1 Minute)

### Prerequisites
* **Node.js** (v18 or higher)
* An **API Key** (either a completely free Google Gemini key or an Anthropic Claude key)

### Local Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/wrong-answers-only.git
   cd wrong-answers-only
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your API Key. The application dynamically detects whichever key is loaded!
   * **To use Google Gemini (100% Free - Recommended)**:
     * Get a key from [Google AI Studio](https://aistudio.google.com/).
     * On **Windows (PowerShell)**:
       ```powershell
       $env:GEMINI_API_KEY="your_free_gemini_key_here"
       npm run dev
       ```
     * On **macOS/Linux (Terminal)**:
       ```bash
       export GEMINI_API_KEY="your_free_gemini_key_here"
       npm run dev
       ```
   * **To use Anthropic Claude**:
     * On **Windows (PowerShell)**:
       ```powershell
       $env:ANTHROPIC_API_KEY="your_anthropic_key_here"
       npm run dev
       ```
     * On **macOS/Linux (Terminal)**:
       ```bash
       export ANTHROPIC_API_KEY="your_anthropic_key_here"
       npm run dev
       ```

4. Open [http://localhost:3000](http://localhost:3000) and start picking wrong answers!

### Replit / Cloud Deployment
1. Fork or import this repository directly into your [Replit](https://replit.com) account.
2. Open the **Secrets tool** (the padlock icon on the left panel).
3. Add a new secret with the key `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`) and paste your API key.
4. Press the green **Run** button. Replit uses the `.replit` config to deploy the Node environment and serves a public URL immediately!

---

## 🧠 The Prompts & Prompt Engineering Workflow

### What I Settled On (Final Production System Prompt)
The server dynamically injects the user's selected humor style and compiles this system prompt before calling Claude:

```
You are the quiz engine for "Wrong Answers Only" — a game where every multiple-choice answer is deliberately incorrect, but sounds plausible.

RULES (non-negotiable):
1. Generate exactly ONE question about the given topic.
2. Provide exactly FOUR answer options labeled A, B, C, D.
3. ALL FOUR answers must be WRONG. There is NO correct answer. This is the entire joke.
4. Each wrong answer should sound confident and plausible to someone who half-remembers the topic.
5. For each answer, write a witty 1-2 sentence explanation of WHY it is wrong.
6. The question itself should be a normal factual question — the humor comes from all answers being wrong.
7. CRITICAL: The explanation for WHY it is wrong must be written in the persona/style of a [Dynamic Style Description].

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

Do not include markdown, code fences, or any text outside the JSON object.
```

### Prompt Iteration & Engineering History

* **Attempt 1: Simple instructions** (*"Generate a quiz about the topic where all 4 answers are wrong"*):
  * **Result**: Claude often slipped and made one answer correct anyway, or turned the question itself into a joke (e.g., "What is 2+2?" with answers like "Apple", "Banana").
* **Attempt 2: Adding schema & strict JSON structure**:
  * **Result**: Better, but Claude occasionally wrapped the JSON in markdown code blocks (\`\`\`json ... \`\`\`), causing parsing to crash in standard JSON parsers.
* **Attempt 3 (Production Stable)**:
  * **Solution**: Implemented non-negotiable numbered rules forcing the question to remain *completely serious/factual* and all answers to be *confidently, plausibly incorrect*. On the backend, a robust regular expression extraction (`match(/\{[\s\S]*\}/)`) parses out the JSON block regardless of whether Claude wraps it in markdown blocks or outputs extra conversational text.
* **Attempt 4 (Premium Multi-Style)**:
  * **Solution**: Injected the dynamic HSL tone descriptors into rule #7. This directs Claude to adopt a specific vocabulary (e.g., swashbuckling pirate jargon or corporate buzzwords) *only* inside the answer explanation section while keeping the original question and the wrong choices professional and educational.

---

## 🛠️ Tech Stack & Architecture

* **Backend**: Node.js, Express, Anthropic SDK (`@anthropic-ai/sdk`)
* **Frontend**: Vanilla HTML5, CSS3 Custom Properties (Variables), modern Google Fonts (*Space Grotesk* and *JetBrains Mono*)
* **Sounds**: Procedural Web Audio API Oscillator Nodes
* **AI Model**: `claude-3-5-sonnet-latest` (extremely fast, stable structure, and excels at creative writing/roleplay)

---

## 📂 Project Structure

```
wrong-answers-only/
├── server.js          # Express API server + dynamic Claude system prompt injection
├── public/
│   ├── index.html     # HTML page structure (with scoreboard, toggle icons, sound indicators)
│   ├── styles.css     # Dark mode glassmorphic styling, keyframe glows, button transitions
│   └── app.js         # Audio synthesizer, localStorage stats, confetti, clipboard sharing
├── package.json       # Project scripts and dependency registry
├── .env.example       # API Key instructions
├── .replit            # Replit configurations for quick cloud deployment
└── README.md          # Comprehensive documentation
```

---

## 📄 License
This project is licensed under the MIT License - feel free to use it, play it, or fork it!
