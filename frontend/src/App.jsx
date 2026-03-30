import React, { useState, useRef } from 'react'
import Editor from '@monaco-editor/react'
import ReviewPanel from './ReviewPanel.jsx'
import axios from 'axios'

const DEFAULT_CODE = `console.log("Hello World");`

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
]

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [language, setLanguage] = useState('javascript')
  const [review, setReview] = useState(null)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [output, setOutput] = useState("")

  const editorRef = useRef(null)

  function handleEditorMount(editor) {
    editorRef.current = editor
  }

  // AI Review
  async function handleReview() {
    if (!code.trim()) return

    setStatus('loading')
    setReview(null)

    try {
      const res = await axios.post('/api/review', { code, language })
      setReview(res.data.review)
      setStatus('idle')
    } catch (err) {
      setErrorMsg("Review failed")
      setStatus('error')
    }
  }

  // Run Code
  async function handleRun() {
    if (!code.trim()) return

    try {
      const res = await axios.post('/api/run', { code, language })
      setOutput(res.data.output)
    } catch (err) {
      setOutput("Error running code")
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h2>🚀 AI Code Editor (Groq + Piston)</h2>
      </header>

      <div className="toolbar">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>

        <button onClick={handleRun}>▶ Run Code</button>

        <button onClick={handleReview}>
          ✨ Review Code
        </button>
      </div>

      <div style={{ display: "flex", height: "70vh" }}>
        <Editor
          width="70%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={(val) => {
            setCode(val || "")
            setOutput("")
          }}
          onMount={handleEditorMount}
        />

        <div style={{ width: "30%", padding: "10px", overflow: "auto" }}>
          <ReviewPanel
            review={review}
            status={status}
            errorMsg={errorMsg}
          />
        </div>
      </div>

      <div style={{ padding: "10px", background: "#111", color: "#0f0" }}>
        <h3>Output:</h3>
        <pre>{output || "Run your code to see output..."}</pre>
      </div>
    </div>
  )
}