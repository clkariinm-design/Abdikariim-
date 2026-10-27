import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "30mb" }));

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Audio transcription and water log parsing endpoint
// Uses gemini-3.5-transcribe for audio transcription and gemini-3.1-flash-lite / gemini-3.5-flash for structured log extraction
app.post("/api/transcribe-intake", async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body;

    if (!audioBase64) {
      res.status(400).json({ error: "audioBase64 is required" });
      return;
    }

    const ai = getGenAI();

    // 1. Transcribe audio using gemini-3.5-transcribe
    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(";")[0], // e.g. "audio/webm"
        data: audioBase64,
      },
    };

    const transcribeResponse = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          audioPart,
          {
            text: "Transcribe the spoken words in this audio exactly. Do not add commentary or assumptions. Return only the verbatim transcription.",
          },
        ],
      },
    });

    const transcript = transcribeResponse.text?.trim() || "";

    if (!transcript) {
      res.json({
        transcript: "",
        parsed: {
          amountMl: 250,
          beverage: "Water",
          notes: "Voice entry (no clear speech detected)",
        },
      });
      return;
    }

    // 2. Parse water intake details using gemini-3.1-flash-lite for fast structured output
    const extractionResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `You are a hydration assistant. Extract the water/beverage intake information from this voice transcript: "${transcript}".
Identify:
- amountMl: number in milliliters (if ounces/oz are spoken, convert 1 oz = 29.57 ml. If a "glass" or "cup" is mentioned without amount, estimate 250 ml. If a "standard bottle" estimate 500 ml. If a "sip" estimate 50 ml. Default to 250 if unspecified).
- beverage: string (e.g. "Water", "Lemon Water", "Herbal Tea", "Sparkling Water", "Coconut Water", "Electrolytes", "Coffee").
- notes: short string description (e.g. "Glass after workout", "Warm mug", etc.).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amountMl: {
              type: Type.NUMBER,
              description: "Amount of liquid in milliliters",
            },
            beverage: {
              type: Type.STRING,
              description: "Beverage type",
            },
            notes: {
              type: Type.STRING,
              description: "Brief note or context",
            },
          },
          required: ["amountMl", "beverage"],
        },
      },
    });

    let parsed = {
      amountMl: 250,
      beverage: "Water",
      notes: transcript,
    };

    if (extractionResponse.text) {
      try {
        parsed = JSON.parse(extractionResponse.text.trim());
      } catch (err) {
        console.error("Failed to parse JSON from extraction:", err);
      }
    }

    res.json({
      transcript,
      parsed,
    });
  } catch (error: any) {
    console.error("Error in /api/transcribe-intake:", error);
    res.status(500).json({
      error: error?.message || "Failed to transcribe and process audio",
    });
  }
});

// Gemini Intelligence endpoint: Hydration Coach & Smart Reminders
app.post("/api/hydration-coach", async (req: Request, res: Response) => {
  try {
    const {
      currentIntakeMl,
      dailyGoalMl,
      unit = "ml",
      reminderIntervalMinutes = 60,
      recentLogs = [],
      userTime = new Date().toLocaleTimeString(),
    } = req.body;

    const ai = getGenAI();

    const prompt = `You are an expert, encouraging hydration coach for a daily water tracker app.
Context:
- Current Time: ${userTime}
- Current intake today: ${currentIntakeMl} ml out of goal ${dailyGoalMl} ml (${Math.round(
      (currentIntakeMl / dailyGoalMl) * 100
    )}% reached).
- Scheduled reminder interval: every ${reminderIntervalMinutes} minutes.
- Recent drink logs today: ${JSON.stringify(recentLogs.slice(-4))}

Provide:
1. "reminderMessage": A creative, fresh, contextual reminder message (1-2 sentences) encouraging the user to take a sip right now based on time of day and progress.
2. "statusInsight": A quick analytical tip (1-2 sentences) about their pacing (e.g., whether they need to catch up, are well-paced, or reached their goal).
3. "suggestedNextIntakeMl": Recommended number of ml for their very next drink (e.g. 200, 250, or 350).
4. "funFact": One short, scientifically sound hydration fact.`;

    const coachResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reminderMessage: {
              type: Type.STRING,
              description: "Contextual reminder message for immediate display",
            },
            statusInsight: {
              type: Type.STRING,
              description: "Analysis of pacing and remaining hydration needs",
            },
            suggestedNextIntakeMl: {
              type: Type.NUMBER,
              description: "Suggested volume for next drink in ml",
            },
            funFact: {
              type: Type.STRING,
              description: "Short interesting hydration fact",
            },
          },
          required: [
            "reminderMessage",
            "statusInsight",
            "suggestedNextIntakeMl",
            "funFact",
          ],
        },
      },
    });

    let advice = {
      reminderMessage: "Time for a refreshing sip! Keep your body energized.",
      statusInsight: `You have drank ${currentIntakeMl} ml of your ${dailyGoalMl} ml goal.`,
      suggestedNextIntakeMl: 250,
      funFact: "Drinking water boosts alertness and cognitive function naturally.",
    };

    if (coachResponse.text) {
      try {
        advice = JSON.parse(coachResponse.text.trim());
      } catch (err) {
        console.error("Failed to parse coach JSON:", err);
      }
    }

    res.json(advice);
  } catch (error: any) {
    console.error("Error in /api/hydration-coach:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate hydration coach advice",
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
