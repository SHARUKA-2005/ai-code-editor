import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import ReviewPanel from "./ReviewPanel";

export default function App() {
  const [code, setCode] = useState(`console.log("Hello World");`);
  const [language, setLanguage] = useState("javascript");

  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);

  const [review, setReview] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [activeTab, setActiveTab] = useState("output");

  // ▶ RUN CODE
  const handleRun = async () => {
    setRunning(true);
    setOutput("");
    setActiveTab("output");

    try {
      const res = await axios.post("/api/run", {
        code,
        language,
        input,
      });

      setOutput(res.data.output);
    } catch (err) {
      setOutput("❌ Error running code");
    }

    setRunning(false);
  };

  // ✨ REVIEW CODE
  const handleReview = async () => {
    setStatus("loading");
    setActiveTab("review");

    try {
      const res = await axios.post("/api/review", {
        code,
        language,
      });

      setReview(res.data.review);
      setStatus("idle");
    } catch {
      setErrorMsg("Review failed");
      setStatus("error");
    }
  };

  return (
    <div className="app">

      {/* 🔝 HEADER */}
      <div className="header">
        <div className="logo">CodeAI</div>

        <div className="controls">
          {/* LANGUAGE */}
          <select
            className="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>

          {/* BUTTONS */}
          <button className="run-btn" onClick={handleRun}>
            {running ? "Running..." : "▶ Run"}
          </button>

          <button className="review-btn" onClick={handleReview}>
            ✦ AI Review
          </button>
        </div>
      </div>

      {/* 🧠 MAIN */}
      <div className="main">

        {/* 🧾 EDITOR */}
        <div className="editor">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val)}
          />
        </div>

        {/* 📊 RIGHT PANEL */}
        <div className="right">

          {/* TAB HEADER */}
          <div className="tabs">
            <button
              className={activeTab === "output" ? "active" : ""}
              onClick={() => setActiveTab("output")}
            >
              ● Output
            </button>

            <button
              className={activeTab === "review" ? "active" : ""}
              onClick={() => setActiveTab("review")}
            >
              ✦ AI Review
            </button>
          </div>

          {/* OUTPUT PANEL */}
          {activeTab === "output" && (
            <div className="output-panel">

              {/* INPUT */}
              <div className="stdin">
                <div className="label">stdin</div>

                <textarea
                  placeholder="Enter input here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>

              {/* OUTPUT */}
              <div className="stdout">
                <div className="label">$ stdout</div>

                <pre>
                  {running
                    ? "Running..."
                    : output || "Run your code to see output"}
                </pre>
              </div>

            </div>
          )}

          {/* REVIEW PANEL */}
          {activeTab === "review" && (
            <ReviewPanel
              review={review}
              status={status}
              errorMsg={errorMsg}
            />
          )}

        </div>
      </div>
    </div>
  );
}