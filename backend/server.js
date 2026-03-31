// server.js - FINAL MULTI-LANGUAGE VERSION

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
// GROQ SETUP
// ─────────────────────────────────────────────
let groq = null;

if (process.env.GROQ_API_KEY && Groq) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ─────────────────────────────────────────────
// AI REVIEW
// ─────────────────────────────────────────────
app.post("/api/review", async (req, res) => {
  const { code, language } = req.body;

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
// RUN CODE (MULTI LANGUAGE + INPUT)
// ─────────────────────────────────────────────
app.post("/api/run", async (req, res) => {
  const { code, language, input = "" } = req.body;

  if (!code) {
    return res.status(400).json({ output: "No code provided" });
  }

  // 🔹 TRY PISTON (optional)
  try {
    const response = await axios.post(PISTON_URL, {
      language,
      version: "*",
      files: [{ content: code }],
      stdin: input,
    });

    return res.json({
      output:
        response.data.run?.output ||
        response.data.run?.stderr ||
        "No output",
    });

  } catch {
    console.log("⚠️ Piston failed → using local execution");
  }

  // 🔹 LOCAL EXECUTION
  try {
    let command = "";

    // ✅ JAVASCRIPT
    if (language === "javascript") {
      fs.writeFileSync("temp.js", code);
      command = "node temp.js";
    }

    // ✅ PYTHON
    else if (language === "python") {
      fs.writeFileSync("temp.py", code);
      command = "python temp.py";
    }

    // ✅ C++
    else if (language === "cpp") {
      fs.writeFileSync("temp.cpp", code);

      exec("g++ temp.cpp -o temp.exe", (compileErr) => {
        if (compileErr) {
          return res.json({ output: compileErr.message });
        }

        const runProcess = exec("temp.exe", (err, stdout, stderr) => {
          if (err) return res.json({ output: stderr || err.message });
          res.json({ output: stdout });
        });

        if (input) runProcess.stdin.write(input + "\n");
        runProcess.stdin.end();
      });

      return;
    }

    // ✅ JAVA
    else if (language === "java") {
      fs.writeFileSync("Main.java", code);

      exec("javac Main.java", (compileErr) => {
        if (compileErr) {
          return res.json({ output: compileErr.message });
        }

        const runProcess = exec("java Main", (err, stdout, stderr) => {
          if (err) return res.json({ output: stderr || err.message });
          res.json({ output: stdout });
        });

        if (input) runProcess.stdin.write(input + "\n");
        runProcess.stdin.end();
      });

      return;
    }

    else {
      return res.json({
        output: "⚠️ Language not supported",
      });
    }

    // 🔥 RUN JS / PYTHON
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        return res.json({
          output: stderr || error.message,
        });
      }

      res.json({
        output: stdout || "✅ No output",
      });
    });

    // ✅ FIXED INPUT (VERY IMPORTANT)
    if (input) {
      process.stdin.write(input + "\n");
    }

    process.stdin.end();

  } catch (err) {
    res.status(500).json({
      output: "Execution failed",
    });
  }
});

// ─────────────────────────────────────────────
// SERVE FRONTEND
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