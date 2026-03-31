// server.js - FINAL DEPLOYABLE VERSION

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Optional Groq
let Groq;
try {
  Groq = require("groq-sdk");
} catch {
  console.log("Groq not installed (AI review disabled)");
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const PISTON_URL =
  process.env.PISTON_API_URL || "http://127.0.0.1:2000/api/v2/execute";

// ─────────────────────────────────────────────
// GROQ SETUP (OPTIONAL)
// ─────────────────────────────────────────────
let groq = null;

if (process.env.GROQ_API_KEY && Groq) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

// ─────────────────────────────────────────────
// ROOT ROUTE (fix "Cannot GET /")
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("🚀 AI Code Editor Backend is running!");
});

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ─────────────────────────────────────────────
// AI REVIEW ROUTE
// ─────────────────────────────────────────────
app.post("/api/review", async (req, res) => {
  const { code, language = "javascript" } = req.body;

  if (!groq) {
    return res.json({
      review: "⚠️ AI review not configured (missing GROQ_API_KEY)",
    });
  }

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  const prompt = `
You are an expert developer. Review this ${language} code.

Give:
- Bugs
- Improvements
- Suggestions

Code:
${code}
`;

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({
      review: completion.choices[0].message.content,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      error: "AI review failed",
    });
  }
});

// ─────────────────────────────────────────────
// RUN CODE (FIXED VERSION)
// ─────────────────────────────────────────────
app.post("/api/run", async (req, res) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ output: "No code provided" });
  }

  // 🔹 STEP 1: TRY PISTON (if available)
  try {
    const response = await axios.post(PISTON_URL, {
      language,
      version: "*",
      files: [{ content: code }],
    });

    return res.json({
      output:
        response.data.run?.output ||
        response.data.run?.stderr ||
        "No output",
    });

  } catch (err) {
    console.log("⚠️ Piston not working → switching to local execution");
  }

  // 🔹 STEP 2: LOCAL EXECUTION (JS + PYTHON)
  try {
    if (language === "javascript") {
      fs.writeFileSync("temp.js", code);

      exec("node temp.js", (error, stdout, stderr) => {
        if (error) {
          return res.json({ output: stderr || error.message });
        }
        res.json({ output: stdout });
      });

    } else if (language === "python") {
      fs.writeFileSync("temp.py", code);

      exec("python temp.py", (error, stdout, stderr) => {
        if (error) {
          return res.json({ output: stderr || error.message });
        }
        res.json({ output: stdout });
      });

    } else {
      res.json({
        output: "⚠️ Only JavaScript & Python supported",
      });
    }

  } catch (err) {
    res.status(500).json({
      output: "Execution failed",
    });
  }
});

// ─────────────────────────────────────────────
// SERVE FRONTEND (FOR SINGLE DEPLOY)
// ─────────────────────────────────────────────
const frontendPath = path.join(__dirname, "../frontend/dist");

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});