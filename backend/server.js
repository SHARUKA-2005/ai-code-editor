require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

// ✅ REQUIRED for run
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express(); // ✅ MUST COME BEFORE app.post

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─── Groq Setup ─────────────────────────────────────────
if (!process.env.GROQ_API_KEY) {
  console.error("❌ Missing GROQ_API_KEY");
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── REVIEW ROUTE ───────────────────────────────────────
app.post("/api/review", async (req, res) => {
  const { code, language = "javascript" } = req.body;

  if (!code.trim()) {
    return res.status(400).json({ error: "No code provided." });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "user",
          content: `Review this ${language} code:\n\n${code}`,
        },
      ],
    });

    res.json({
      review: completion.choices[0].message.content,
    });

  } catch (err) {
    res.status(500).json({
      error: "Review failed",
    });
  }
});

// ─── RUN CODE (LOCAL JS + PYTHON) ───────────────────────
app.post("/api/run", (req, res) => {
  const { code, language } = req.body;

  let filePath, command;

  try {
    if (language === "javascript") {
      filePath = path.join(__dirname, "temp.js");
      fs.writeFileSync(filePath, code);
      command = `node ${filePath}`;
    }

    else if (language === "python") {
      filePath = path.join(__dirname, "temp.py");
      fs.writeFileSync(filePath, code);
      command = `python ${filePath}`;
    }

    else {
      return res.json({
        output: "❌ Only JS & Python supported",
      });
    }

    exec(command, { timeout: 5000 }, (err, stdout, stderr) => {
      if (err) {
        return res.json({
          output: stderr || err.message,
        });
      }

      res.json({
        output: stdout || "✅ No output",
      });
    });

  } catch (error) {
    res.json({
      output: error.message,
    });
  }
});

// ─── HEALTH CHECK ───────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ─── START SERVER ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});