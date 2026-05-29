const LOADING_MESSAGES = [
  "Consulting the wrong oracle...",
  "Generating plausible nonsense...",
  "Ensuring zero correct answers...",
  "Fact-checking in reverse...",
  "Brewing confident misinformation...",
  "Asking Wikipedia's evil twin...",
  "Calibrating the wrong-o-meter...",
  "Deleting truth files...",
  "Summoning confidently incorrect spirits..."
];

const STORAGE_KEY = "wrongAnswersOnly";

let currentTopic = "";
let currentQuiz = null;
let currentStyle = "sarcastic"; // default style

let score = 0;
let streak = 0;
let bestStreak = 0;
let totalPlays = 0;

let audioCtx = null;
let isMuted = false;

const sections = {
  topic: document.getElementById("topicSection"),
  loading: document.getElementById("loadingSection"),
  quiz: document.getElementById("quizSection"),
  result: document.getElementById("resultSection"),
  error: document.getElementById("errorSection"),
};

const els = {
  score: document.getElementById("score"),
  streak: document.getElementById("streak"),
  bestStreak: document.getElementById("bestStreak"),
  totalPlays: document.getElementById("totalPlays"),
  streakFire: document.getElementById("streakFire"),
  topicForm: document.getElementById("topicForm"),
  topicInput: document.getElementById("topicInput"),
  topicChips: document.getElementById("topicChips"),
  styleChips: document.getElementById("styleChips"),
  generateBtn: document.getElementById("generateBtn"),
  loadingMessage: document.getElementById("loadingMessage"),
  topicBadge: document.getElementById("topicBadge"),
  styleBadge: document.getElementById("styleBadge"),
  question: document.getElementById("question"),
  answers: document.getElementById("answers"),
  selectedAnswer: document.getElementById("selectedAnswer"),
  explanation: document.getElementById("explanation"),
  nextBtn: document.getElementById("nextBtn"),
  newTopicBtn: document.getElementById("newTopicBtn"),
  retryBtn: document.getElementById("retryBtn"),
  shareBtn: document.getElementById("shareBtn"),
  errorTitle: document.getElementById("errorTitle"),
  errorMessage: document.getElementById("errorMessage"),
  soundToggle: document.getElementById("soundToggle"),
  toast: document.getElementById("toast")
};

// --- Web Audio Retro Synth ---
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (isMuted) return;
  try {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    
    if (type === 'click') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.08);
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.06);
        gain.gain.setValueAtTime(0.04, now + index * 0.06);
        gain.gain.linearRampToValueAtTime(0.001, now + index * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + index * 0.06);
        osc.stop(now + index * 0.06 + 0.15);
      });
    } else if (type === 'success-big') {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.05);
        gain.gain.setValueAtTime(0.03, now + index * 0.05);
        gain.gain.linearRampToValueAtTime(0.001, now + index * 0.05 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + index * 0.05);
        osc.stop(now + index * 0.05 + 0.4);
      });
    } else if (type === 'error') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.25);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.25);
    } else if (type === 'intro') {
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        gain.gain.setValueAtTime(0.03, now + index * 0.08);
        gain.gain.linearRampToValueAtTime(0.001, now + index * 0.08 + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.5);
      });
    }
  } catch (e) {
    console.warn("Sound failed to play:", e);
  }
}

// --- Confetti / Particle Animation ---
function triggerConfetti() {
  const container = document.body;
  const colors = ['#ff4757', '#ffa502', '#2ed573', '#3b82f6', '#e056fd'];
  for (let i = 0; i < 45; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = (Math.random() * 20 - 15) + 'px';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.transform = `scale(${Math.random() * 0.6 + 0.6})`;
    
    const speedX = (Math.random() - 0.5) * 15;
    const speedY = Math.random() * 8 + 6;
    
    container.appendChild(particle);
    
    let currentY = parseFloat(particle.style.top);
    let rotation = Math.random() * 360;
    const startTime = Date.now();
    const duration = 1200; // ms
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        currentY += speedY * (1 - progress * 0.3);
        particle.style.transform = `translate3d(${progress * speedX * 25}px, ${currentY}px, 0) rotate(${rotation + progress * 720}deg)`;
        particle.style.opacity = 1 - progress;
        requestAnimationFrame(animate);
      } else {
        particle.remove();
      }
    }
    
    requestAnimationFrame(animate);
  }
}

// --- Score & Sound State Persistence ---
function loadScore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      score = saved.score || 0;
      streak = saved.streak || 0;
      bestStreak = saved.bestStreak || 0;
      totalPlays = saved.totalPlays || 0;
    }
  } catch {
    score = 0;
    streak = 0;
    bestStreak = 0;
    totalPlays = 0;
  }
  updateScoreboard();
}

function saveScore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ score, streak, bestStreak, totalPlays }));
  } catch {
    // localStorage unavailable
  }
}

function updateScoreboard() {
  els.score.textContent = score;
  els.streak.textContent = streak;
  els.bestStreak.textContent = bestStreak;
  els.totalPlays.textContent = totalPlays;
  els.streakFire.classList.toggle("active", streak >= 3);
}

function loadSoundState() {
  try {
    const saved = localStorage.getItem("wrongAnswersMuted");
    if (saved !== null) {
      isMuted = JSON.parse(saved);
      updateSoundIcons();
    }
  } catch {}
}

function updateSoundIcons() {
  const soundOnIcon = els.soundToggle.querySelector(".sound-on");
  const soundOffIcon = els.soundToggle.querySelector(".sound-off");
  if (isMuted) {
    soundOnIcon.classList.add("hidden");
    soundOffIcon.classList.remove("hidden");
  } else {
    soundOnIcon.classList.remove("hidden");
    soundOffIcon.classList.add("hidden");
  }
}

// --- Navigation ---
function showSection(name) {
  Object.values(sections).forEach((s) => s.classList.add("hidden"));
  sections[name].classList.remove("hidden");
}

function randomLoadingMessage() {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

function rotateLoadingMessages() {
  els.loadingMessage.textContent = randomLoadingMessage();
  return setInterval(() => {
    els.loadingMessage.textContent = randomLoadingMessage();
  }, 2500);
}

// --- API Quiz Generation ---
async function generateQuiz(topic) {
  currentTopic = topic;
  showSection("loading");

  const intervalId = rotateLoadingMessages();
  els.generateBtn.disabled = true;

  try {
    const res = await fetch("/api/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, style: currentStyle }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    currentQuiz = data;
    renderQuiz(data);
    showSection("quiz");
  } catch (err) {
    playSound('error');
    showError(err.message);
  } finally {
    clearInterval(intervalId);
    els.generateBtn.disabled = false;
  }
}

function renderQuiz(quiz) {
  els.topicBadge.textContent = currentTopic;
  
  const styleLabels = {
    sarcastic: "🎙️ Sarcastic Tone",
    pirate: "🏴‍☠️ Pirate Tone",
    corporate: "👔 Corporate Tone",
    genz: "💀 Gen-Z Tone",
    shakespeare: "🎭 Bard Tone"
  };
  els.styleBadge.textContent = styleLabels[currentStyle] || styleLabels.sarcastic;

  els.question.textContent = quiz.question;
  els.answers.innerHTML = "";

  quiz.answers.forEach((answer) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.innerHTML = `
      <span class="answer-id">${answer.id}</span>
      <span>${escapeHtml(answer.text)}</span>
    `;
    btn.addEventListener("click", () => selectAnswer(answer, btn));
    els.answers.appendChild(btn);
  });
}

function selectAnswer(answer, btn) {
  btn.classList.add("shake");
  btn.classList.add("selected");
  
  document.querySelectorAll(".answer-btn").forEach((b) => {
    b.disabled = true;
  });

  // Increment counters (since ALL answers are incorrect, user always gets it "right")
  score += 1;
  streak += 1;
  totalPlays += 1;
  if (streak > bestStreak) {
    bestStreak = streak;
  }
  
  saveScore();
  updateScoreboard();

  if (streak >= 3) {
    playSound('success-big');
    triggerConfetti();
  } else {
    playSound('success');
  }

  setTimeout(() => {
    els.selectedAnswer.textContent = `${answer.id}. ${answer.text}`;
    els.explanation.textContent = answer.explanation;
    showSection("result");
  }, 500);
}

function showError(message) {
  els.errorTitle.textContent = "Something went wrong";
  els.errorMessage.textContent = message;
  showSection("error");
}

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  setTimeout(() => {
    els.toast.classList.add("hidden");
  }, 2500);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// --- Event Listeners ---
els.topicForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const topic = els.topicInput.value.trim();
  if (topic) {
    playSound('click');
    generateQuiz(topic);
  }
});

els.topicChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  const topic = chip.dataset.topic;
  els.topicInput.value = topic;
  playSound('click');
  generateQuiz(topic);
});

if (els.styleChips) {
  els.styleChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".style-chip");
    if (!chip) return;
    document.querySelectorAll(".style-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentStyle = chip.dataset.style;
    playSound('click');
  });
}

els.nextBtn.addEventListener("click", () => {
  playSound('click');
  generateQuiz(currentTopic);
});

els.newTopicBtn.addEventListener("click", () => {
  playSound('click');
  currentTopic = "";
  currentQuiz = null;
  els.topicInput.value = "";
  showSection("topic");
});

els.retryBtn.addEventListener("click", () => {
  playSound('click');
  if (currentTopic) {
    generateQuiz(currentTopic);
  } else {
    showSection("topic");
  }
});

if (els.soundToggle) {
  els.soundToggle.addEventListener("click", () => {
    isMuted = !isMuted;
    updateSoundIcons();
    try {
      localStorage.setItem("wrongAnswersMuted", JSON.stringify(isMuted));
    } catch {}
    if (!isMuted) {
      playSound('click');
    }
  });
}

if (els.shareBtn) {
  els.shareBtn.addEventListener("click", () => {
    if (!currentQuiz || !currentQuiz.question) return;
    
    const selectedText = els.selectedAnswer.textContent;
    const explanationText = els.explanation.textContent;
    const styleName = currentStyle.charAt(0).toUpperCase() + currentStyle.slice(1);
    
    const shareText = `🚫 WRONG ANSWERS ONLY
❓ Q: ${currentQuiz.question}
❌ I selected: "${selectedText}"
🎙️ Claude's explanation (${styleName} style):
"${explanationText}"
🔥 Current wrong streak: ${streak}! Play live & fail together!`;

    navigator.clipboard.writeText(shareText).then(() => {
      playSound('click');
      showToast("Roast copied to clipboard! 📋");
    }).catch(err => {
      console.error("Clipboard copy failed: ", err);
      showToast("Failed to copy roast 😿");
    });
  });
}

// --- Initialization ---
window.addEventListener("DOMContentLoaded", () => {
  loadSoundState();
  loadScore();
  
  // Warm up audio context on first user gesture to bypass browser restrictions
  document.body.addEventListener("click", () => {
    if (audioCtx === null) {
      playSound('intro');
    }
  }, { once: true });
});
