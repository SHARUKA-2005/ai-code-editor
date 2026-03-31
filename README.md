# &lt;CodeAI /&gt; — AI-Powered Code Editor

A sleek, browser-based code editor with integrated AI code review powered by **Groq** and live code execution for JavaScript and Python.

[Kindly Note: The main project is the code editor , managed and hosted by the users. If the User wishes to review using AI , they can opt for 
Groq API which is provided to enhance the project. THE API DOES NOT CONTRIBUTE TO THE CORE FUNCTIONALITY OF THE PROJECT]

---

## ✨ Features

- **Monaco Editor** — the same editor that powers VS Code, with syntax highlighting for 7 languages
- **AI Code Review** — sends your code to Groq's LLM and returns intelligent feedback instantly
- **Live Code Execution** — runs JavaScript and Python directly on the server and streams output
- **Multi-language Support** — JavaScript, Python
- **Tabbed Output Panel** — switch between terminal output and AI review without losing context

---

## 🗂 Project Structure

```
project/
├── server.js          # Express backend — /api/review, /api/run, /api/health
├── src/
│   ├── App.jsx        # Main React component & layout
│   ├── App.css        # All styles (dark IDE theme)
│   └── ReviewPanel.jsx  # AI review display component
├── .env               # Environment variables (not committed)
├── package.json
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js v18+
- Python 3 (for Python code execution)
- A [Groq API key](https://console.groq.com/)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/codeai-editor.git
cd codeai-editor
```

### 2. Install dependencies

**Backend:**
```bash
npm install
```

**Frontend** (if in a separate directory):
```bash
cd client
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

### 4. Run the development server

**Start backend:**
```bash
node server.js
```

**Start frontend** (in a separate terminal):
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (Vite default) or whichever port your frontend dev server uses.

---

## 🔌 API Reference

### `POST /api/review`

Sends code to the Groq LLM for an AI-powered review.

**Request body:**
```json
{
  "code": "console.log('hello')",
  "language": "javascript"
}
```

**Response:**
```json
{
  "review": "Your code looks clean. Consider adding error handling..."
}
```

---

### `POST /api/run`

Executes JavaScript or Python code on the server in a sandboxed child process (5s timeout).

**Request body:**
```json
{
  "code": "print('hello')",
  "language": "python"
}
```

**Response:**
```json
{
  "output": "hello\n"
}
```

> ⚠️ Only `javascript` and `python` are supported for execution. Other languages return an error message.

---

### `GET /api/health`

Health check endpoint.

**Response:**
```json
{ "status": "ok" }
```

---

## 🎨 Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React, Monaco Editor (`@monaco-editor/react`) |
| HTTP      | Axios                               |
| Backend   | Node.js, Express                    |
| AI        | Groq SDK (`groq-sdk`)               |
| Execution | Node.js `child_process` (exec)      |
| Styling   | Custom CSS (JetBrains Mono + Syne)  |

---
---
### Screenshot
<img width="1918" height="881" alt="image" src="https://github.com/user-attachments/assets/f99c88a3-98df-455b-b323-5b34f2db02b7" />
<img width="1920" height="535" alt="image" src="https://github.com/user-attachments/assets/a964b69f-76af-44e9-8e97-8725042495c4" />



---

## 🔒 Security Notes

- Code execution runs with a **5-second timeout** to prevent infinite loops.
- Only JavaScript and Python are supported to limit attack surface.
- The server writes temporary files (`temp.js` / `temp.py`) to disk for execution — in production, consider running these in isolated containers (e.g., Docker) or using a service like [Piston](https://github.com/engineer-man/piston).
- Never expose this server publicly without authentication — arbitrary code execution endpoints must be protected.

---

## 🚀 Deployment

For production, consider:

1. **Containerize execution** — wrap `exec` calls inside Docker to sandbox user code
2. **Add rate limiting** — use `express-rate-limit` to prevent abuse
3. **Authentication** — protect all `/api/*` routes
4. **Use Piston API** — replace local execution with the [Piston API](https://github.com/engineer-man/piston) for safer, multi-language support

---

## 📄 License

MIT © 2026 — feel free to use, modify, and distribute.
