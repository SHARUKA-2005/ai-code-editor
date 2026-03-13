// server.js - Main Express server for the AI Code Editor backend

// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────

// Allow requests from the frontend (React dev server runs on port 5173)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// ─── Gemini AI Setup ──────────────────────────────────────────────────────────

// Initialize the Gemini client using the API key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use the Gemini 1.5 Flash model (free tier, fast)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/review
 * Accepts { code, language } in the request body.
 * Sends the code to Gemini and returns the AI review as a string.
 */
app.post("/api/review", async (req, res) => {
  const { code, language = "javascript" } = req.body;

  // Basic validation — make sure code was actually sent
  if (!code || code.trim() === "") {
    return res.status(400).json({ error: "No code provided for review." });
  }

  // Craft the review prompt for Gemini
  const prompt = `
You are an expert software engineer performing a code review.
Analyze the following ${language} code and provide a constructive code review.

Please cover :
1. 🐛 Bugs — any logical or runtime errors
2. ⚡ Performance — bottlenecks or inefficiencies
3. 📖 Readability — naming, structure, clarity
4. ✅ Best Practices — language-specific conventions and patterns
5. 💡 Suggestions — specific improvements with brief code examples where applicable

Format your response in clear sections using Markdown.

Code to review:
\`\`\`${language}
${code}
\`\`\`
  `.trim();

  try {
    // Call the Gemini API with our prompt
    const result = await model.generateContent(prompt);

    // Extract the text response from Gemini's response object
    const reviewText = result.response.text();

    // Send the review back to the frontend
    res.json({ review: reviewText });
  } catch (error) {
    console.error("Gemini API Error:", error.message);

    // Return a friendly error to the frontend
    res.status(500).json({
      error: "Failed to get review from Gemini. Please check your API key.",
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
