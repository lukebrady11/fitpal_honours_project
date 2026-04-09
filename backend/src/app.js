// backend/src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import plannerRoutes from "./routes/planner.js";
import eventsRoutes from "./routes/events.js";
import dietRoutes from "./routes/diet.js";


dotenv.config();

const app = express();

// ✅ Dev-friendly CORS (allows localhost on any port)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.startsWith("http://localhost:")) return callback(null, true);
      if (origin.startsWith("http://127.0.0.1:")) return callback(null, true);
      if (origin.startsWith("https://fitpal-honours-project.vercel.app")) return callback(null, true);
      return callback(new Error("CORS blocked: " + origin)) 
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());
app.use(cookieParser());

function isPlanIntent(message) {
  const text = (message || "").toLowerCase();
  const keywords = [
    "workout plan",
    "training plan",
    "schedule",
    "weekly plan",
    "1-day",
    "2-day",
    "3-day",
    "4-day",
    "5-day",
    "day",
    "this week",
    "routine",
    "gym plan",
    "make",
    "create",
    "generate",
  ];
  return keywords.some((k) => text.includes(k));
}

function extractTimeHHMM(message) {
  const text = (message || "").toLowerCase();

  // Matches 18:00, 6:00pm, 6pm
  const m1 = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (m1) {
    const hh = String(m1[1]).padStart(2, "0");
    const mm = String(m1[2]).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  const m2 = text.match(/\b([1-9]|1[0-2])\s*(am|pm)\b/);
  if (m2) {
    let h = Number(m2[1]);
    const ap = m2[2];
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:00`;
  }

  return "18:00"; // default
}

function extractDaysCount(message) {
  const text = (message || "").toLowerCase();
  const m = text.match(/\b([3-7])\s*[- ]?\s*day\b/);
  if (m) return Number(m[1]);
  return 3;
}

function buildFallbackPlan(message) {
  const time = extractTimeHHMM(message);
  const daysCount = extractDaysCount(message);

  // Simple, sensible pattern
  const patterns = {
    3: ["Mon", "Wed", "Fri"],
    4: ["Mon", "Tue", "Thu", "Sat"],
    5: ["Mon", "Tue", "Wed", "Fri", "Sat"],
    6: ["Mon", "Tue", "Wed", "Thu", "Sat", "Sun"],
    7: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  };

  const chosenDays = patterns[daysCount] || patterns[3];

  const items = chosenDays.map((day, idx) => {
    // Rotate simple sessions
    const templates = [
      "Full-body strength (30–40 min)",
      "Low-impact cardio (25–35 min)",
      "Strength + core (30–40 min)",
      "Mobility + brisk walk (25–35 min)",
    ];
    return { day, time, name: templates[idx % templates.length] };
  });

  return {
    title: `${daysCount}-day weekly plan`,
    items,
  };
}

app.use("/planner", plannerRoutes);
app.use("/auth", authRoutes);
app.use("/events", eventsRoutes);
app.use("/diet", dietRoutes);



const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safetyTriage(message) {
  const text = (message || "").toLowerCase();

  const emergency = [
    "chest pain",
    "tight chest",
    "pressure in chest",
    "can't breathe",
    "cant breathe",
    "severe shortness of breath",
    "fainting",
    "passed out",
    "collapse",
    "stroke",
    "face drooping",
    "slurred speech",
  ];

  const selfHarm = ["kill myself", "suicide", "self harm", "hurt myself"];

  const eatingDisorder = [
    "purge",
    "throw up after eating",
    "vomit after eating",
    "laxatives",
    "starve myself",
    "binging and purging",
  ];

  const pregnancy = ["pregnant and bleeding", "pregnancy pain", "reduced fetal movement"];

  const meds = ["change my medication", "stop my medication", "insulin", "warfarin"];

  const hasAny = (arr) => arr.some((p) => text.includes(p));

  if (hasAny(emergency)) {
    return {
      type: "emergency",
      reply:
        "If you’re having chest pain, severe shortness of breath, fainting, or stroke-like symptoms, please seek urgent help now. In the UK call 999 (or go to A&E). If it’s less severe but you’re worried, contact NHS 111. I can help with general lifestyle guidance once you’re safe.",
    };
  }

  if (hasAny(selfHarm)) {
    return {
      type: "self_harm",
      reply:
        "I’m really sorry you’re feeling like this. If you’re in immediate danger or might act on these thoughts, call 999 now. If you can, contact NHS 111 or Samaritans (116 123) for support. If you want, tell me what’s going on right now and whether you’re safe.",
    };
  }

  if (hasAny(eatingDisorder)) {
    return {
      type: "eating_disorder",
      reply:
        "I can’t help with advice that supports harmful eating behaviours. If you’re struggling with eating, weight, or purging, you deserve proper support — consider speaking to your GP or NHS 111. If you want, I can help with safer, general routines (sleep, gentle movement, balanced meals).",
    };
  }

  if (hasAny(pregnancy)) {
    return {
      type: "pregnancy",
      reply:
        "Because pregnancy symptoms can be serious, it’s best to get professional advice. If there’s bleeding, severe pain, or reduced fetal movement, seek urgent care (NHS 111 or 999 depending on severity). I can help with general wellbeing habits, but not medical guidance here.",
    };
  }

  if (hasAny(meds)) {
    return {
      type: "meds",
      reply:
        "I can’t advise on changing or stopping medication. Please speak to a pharmacist or your GP for medication questions. If you want, I can help with non-medical lifestyle steps alongside your current plan.",
    };
  }

  return null;
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Backend running" });
});

// Chat (with safety triage + structured plan extraction)
app.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message must be a string" });
    }

    // ---- Safety triage first ----
    const triage = safetyTriage(message);
    if (triage) {
      // triage.reply is a safe, non-medical response (your existing function)
      return res.json({
        reply: triage.reply,
        triage: triage.type, // e.g. "self_harm" etc
        planDraft: null,
        dietDraft: null,
      });
    }

    // ---- sanitize + limit conversation history ----
    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .slice(-12)
      : [];

    // Build a transcript (simple + reliable for MVP)
    const transcript = safeHistory
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    // ---- Robust JSON-block extraction (supports ```tag``` and \`\`\`tag\`\`\`) ----
    function extractJsonBlock(text, tag) {
  
      const pattern =
        "(?:```|\\\\`\\\\`\\\\`)\\s*" +
        tag +
        "\\s*([\\s\\S]*?)(?:```|\\\\`\\\\`\\\\`)";
      const re = new RegExp(pattern, "i");

      const m = text.match(re);
      if (!m || !m[1]) return { obj: null, cleaned: text };

      try {
        const obj = JSON.parse(m[1].trim());
        const cleaned = text.replace(m[0], "").trim();
        return { obj, cleaned };
      } catch {
        return { obj: null, cleaned: text };
      }
    }

    const systemPrompt = `
You are “FitPal”, a supportive lifestyle chatbot for adults focused on weight-management habits (fitness + diet).

NON-MEDICAL SCOPE (strict):
- You are not a doctor and do not provide medical advice, diagnosis, or treatment.
- If the user mentions serious symptoms (e.g., chest pain, fainting, severe shortness of breath), eating-disorder behaviours, self-harm, pregnancy complications, medication changes, or any urgent health concern:
  - advise them to seek professional help (NHS 111 / GP / emergency services if severe).
  - keep it calm and brief.

STYLE:
- Friendly, adult-to-adult, non-judgmental, not cheesy.
- Default to concise replies (2–8 short lines).
- Ask one question at a time.

ROUTING:
- If the user asks for a diet/meal plan, respond with diet guidance and output ONLY dietjson.
- If the user asks for a workout plan, respond with workout guidance and output ONLY planjson.
- Only output both blocks if the user explicitly asks for BOTH diet AND workouts.

WORKOUT PLAN OUTPUT:
If the user asks for a weekly workout schedule or plan, include a machine-readable JSON block at the END:

\\\`\\\`\\\`planjson
{
  "title": "string",
  "items": [
    { "day": "Mon", "time": "18:00", "name": "Workout name (details)" }
  ]
}
\\\`\\\`\\\`

Rules:
- Use only days: Mon Tue Wed Thu Fri Sat Sun
- time must be 24h HH:MM
- keep items realistic for a normal adult
- No more than one session per day unless the user asks
- Do not include unsafe or extreme recommendations

PROGRESSIVE PLANS:
If the user asks for multi-week or progressive plan:
- STILL use the same "items" array (do NOT use a separate weeks structure)
- Inlcude the week number in the workout name
Example:
"Week 1 - Easy run (3km)"
"Week 2 - Easy run (4km)"
"Week 3 - Easy run (5km)"

Rules:
- Show gradual progression (distance, duration, or intensity)
- Keep progression realistic and safe
- Prefer 2-4 weeks unless the user asks for longer

DIET PLAN OUTPUT:
If the user asks for a diet plan / meal plan, include a machine-readable JSON block at the END:

\\\`\\\`\\\`dietjson
{
  "title": "string",
  "items": [
    { "meal": "Breakfast", 
     "name": "Meal suggestion" 
     "recipe": [
      "Step 1",
      "Step 2",
      "Step 3"
     ]
    }
  ]
}
\\\`\\\`\\\`

Rules:
- meal must be one of: Breakfast, Lunch, Dinner, Snacks
- Include a short recipe (3-5 simple steps)
- Keep steps clear and beginner-friendly
- Keep meals realistic and easy to prepare
- No calories/macros/targets. No medical claims.
- Keep it simple, balanced, and practical for busy adults.

IMPORTANT:
- Output valid JSON only inside the planjson or dietjson block
- Do not include extra commentary inside the JSON
- Put any normal explanation outside the JSON block


`.trim();

    const input = transcript
      ? `${transcript}\nUser: ${message}\nAssistant:`
      : `User: ${message}\nAssistant:`;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions: systemPrompt,
      input,
    });

    const rawText = response.output_text || "";

    // Extract blocks and remove from reply
    let cleanedReply = rawText;

    const planOut = extractJsonBlock(cleanedReply, "planjson");
    const planDraft = planOut.obj;
    cleanedReply = planOut.cleaned;

    const dietOut = extractJsonBlock(cleanedReply, "dietjson");
    const dietDraft = dietOut.obj;
    cleanedReply = dietOut.cleaned;

    // If the model output nothing but JSON, ensure reply isn't blank
    const finalReply = cleanedReply || "✅ Done — I’ve drafted that for you. Would you like any tweaks?";

    return res.json({
      reply: finalReply,
      planDraft: planDraft && planDraft.items ? planDraft : null,
      dietDraft: dietDraft && dietDraft.items ? dietDraft : null,
      triage: null,
    });
  } catch (err) {
    const status = err?.status || 500;
    const code = err?.code || err?.error?.code;
    const msg = err?.error?.message || err?.message || "Unknown error contacting OpenAI";

    console.error("OpenAI error:", { status, code, message: msg });

    if (status === 429) {
      return res.status(429).json({
        error: "OpenAI quota/rate limit hit. Check API billing/quota for this key/project.",
        code: "insufficient_quota",
      });
    }

    if (status === 401) {
      return res.status(401).json({
        error: "OpenAI authentication failed. Check OPENAI_API_KEY.",
        code: "auth_error",
      });
    }

    return res.status(500).json({
      error: "OpenAI request failed",
      details: msg,
      code: code || "openai_error",
    });
  }
});



// JSON 404 handler (keeps frontend errors readable)
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// JSON error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
