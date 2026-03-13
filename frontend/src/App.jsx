// App.jsx — Main application component
// Handles layout, editor state, and orchestrates the review flow.

import React, { useState, useRef } from 'react'
import Editor from '@monaco-editor/react'
import ReviewPanel from './ReviewPanel.jsx'
import axios from 'axios'

// ── Default starter code shown in the editor ──
const DEFAULT_CODE = `// Welcome to AI Code Editor! ✨
// Write or paste your code here, then click "Review" to get AI feedback.

function calculateFactorial(n) {
    if (n < 0) {
        throw new Error("Factorial is not defined for negative numbers");
    }
    if (n === 0) return 1;

    let result = 1;
    for (let i = 1; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Fetch user data (no error handling)
async function fetchUser(id) {
    try {
        const response = await fetch('/api/users/' + id);
        if (!response.ok) {
            throw new Error("Failed to fetch user");
        }
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error("Error fetching user:", error.message);
        return null;
    }
}

console.log(calculateFactorial(5));
`

// ── Supported languages (easy to extend) ──
const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python',     label: 'Python'     },
  { value: 'java',       label: 'Java'       },
  { value: 'cpp',        label: 'C++'        },
  { value: 'go',         label: 'Go'         },
  { value: 'rust',       label: 'Rust'       },
  { value: 'css',        label: 'CSS'        },
  { value: 'html',       label: 'HTML'       },
]

export default function App() {
  // ── State ──
  const [code, setCode] = useState(DEFAULT_CODE)
  const [language, setLanguage] = useState('javascript')
  const [review, setReview] = useState(null)   // AI review text (markdown string)
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  // Ref to hold the Monaco editor instance (for future direct access if needed)
  const editorRef = useRef(null)

  // Called when Monaco editor mounts
  function handleEditorMount(editor) {
    editorRef.current = editor
  }

  // ── Review Handler ──
  async function handleReview() {
    // Don't submit if empty
    if (!code || code.trim() === '') return

    setStatus('loading')
    setReview(null)
    setErrorMsg('')

    try {
      // POST to our backend — Vite proxy forwards /api → localhost:5000
      const response = await axios.post('/api/review', { code, language })
      setReview(response.data.review)
      setStatus('idle')
    } catch (err) {
      console.error('Review request failed:', err)

      // Show a friendly error message
      const msg =
        err.response?.data?.error ||
        'Could not connect to the server. Make sure the backend is running.'
      setErrorMsg(msg)
      setStatus('error')
    }
  }

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">🤖</div>
          <div>
            <div className="header-title">AI Code Editor</div>
            <div className="header-subtitle">Powered by Google Gemini</div>
          </div>
        </div>
        <div className="header-badge">
          <span className="header-badge-dot" />
          Gemini 1.5 Flash
        </div>
      </header>

      {/* ── Toolbar (language selector + review button) ── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="toolbar-label">Language</span>

          {/* Language selector — changing this updates Monaco's syntax highlighting */}
          <select
            id="language-select"
            className="lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          <div className="file-pill">
            📄 main.{language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'python' ? 'py' : language}
          </div>
        </div>

        {/* Review button — starts the AI analysis */}
        <button
          id="review-button"
          className="review-btn"
          onClick={handleReview}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <>
              <span className="spinner" />
              Analyzing…
            </>
          ) : (
            <>
              ✨ Review Code
            </>
          )}
        </button>
      </div>

      {/* ── Main Two-Panel Layout ── */}
      <main className="main-content">
        {/* LEFT — Monaco Code Editor */}
        <section className="editor-panel">
          <div className="panel-header">
            <span className="panel-dot dot-red" />
            <span className="panel-dot dot-yellow" />
            <span className="panel-dot dot-green" />
            <span className="panel-name">
              editor
            </span>
          </div>

          <div className="editor-wrapper">
            <Editor
              height="100%"
              language={language}
              value={code}
              theme="vs-dark"
              onChange={(val) => setCode(val || '')}
              onMount={handleEditorMount}
              options={{
                fontSize: 14,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                lineNumbers: 'on',
                renderLineHighlight: 'gutter',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                tabSize: 2,
              }}
            />
          </div>
        </section>

        {/* RIGHT — AI Review Panel */}
        <section className="review-panel">
          <ReviewPanel
            review={review}
            status={status}
            errorMsg={errorMsg}
          />
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        AI Code Editor · Built with React, Monaco Editor &amp; Google Gemini
      </footer>
    </div>
  )
}
