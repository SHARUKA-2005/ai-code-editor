// server.js - Main Express server for the AI Code Editor backend

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Environment validation ───────────────────────────────────────────────────
if (!process.env.GROQ_API_KEY) {
  console.error("❌ Missing GROQ_API_KEY in environment variables.");
  process.exit(1);
}

// 🔥 Piston URL (from .env with fallback)
const PISTON_URL =
  process.env.PISTON_API_URL || "http://127.0.0.1:2000/api/v2/execute";

// ─── Groq AI Setup ────────────────────────────────────────────────────────────
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── AI Review Route ──────────────────────────────────────────────────────────
app.post("/api/review", async (req, res) => {
  const { code, language = "javascript" } = req.body;

  if (!code || code.trim() === "") {
    return res.status(400).json({ error: "No code provided for review." });
  }

  const prompt = `
You are an expert software engineer performing a code review.

Analyze the following ${language} code and provide a constructive code review.

Please cover:
1. Bugs — any logical or runtime errors
2. Performance — bottlenecks or inefficiencies
3. Readability — naming, structure, clarity
4. Best Practices — language-specific conventions and patterns
5. Suggestions — specific improvements with brief code examples where applicable

Format your response in clear sections using Markdown.

Code to review:
\`\`\`${language}
${code}
\`\`\`
`.trim();

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const reviewText = completion.choices[0].message.content;

    res.json({ review: reviewText });

  } catch (error) {
    console.error("Groq API Error:", error.message);

    res.status(500).json({
      error: error.message || "Failed to get review from Groq."
    });
  }
});

// ─── Code Execution Route (Docker Piston) ─────────────────────────────────────
app.post("/api/run", async (req, res) => {
  const { code, language } = req.body;

  const languageMap = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    java: "java",
    cpp: "cpp",
    go: "go",
    rust: "rust",
  };

  try {
    const response = await axios.post(
      PISTON_URL,
      {
        language: languageMap[language] || "javascript",
        version: "*",
        files: [{ content: code }],
      },
      {
        timeout: 15000,
      }
    );

    const result = response.data;

    res.json({
      output:
        result.run?.output ||
        result.run?.stderr ||
        result.compile?.stderr ||
        "No output",
    });

  } catch (error) {
    console.error("Piston Error:", error.message);

    res.status(500).json({
      output: "⚠️ Code execution failed. Please try again.",
    });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "AI Code Editor backend is running!" });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});