// server.js - Main Express server for the AI Code Editor backend

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Environment validation ───────────────────────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in environment variables.");
  process.exit(1);
}

// ─── Gemini AI Setup ──────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ─── Routes ───────────────────────────────────────────────────────────────────
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
    const result = await model.generateContent(prompt);
    const reviewText = result.response.text();

    res.json({ review: reviewText });
  } catch (error) {
    console.error("Gemini API Error:", error.message);

    res.status(500).json({
      error: error.message || "Failed to get review from Gemini."
    });
  }
});

// Simple health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "AI Code Editor backend is running!" });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});