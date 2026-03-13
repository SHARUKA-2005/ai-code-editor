# AI Code Editor 🤖✨

A minimal web-based code editor with **AI-powered code review** using Google Gemini.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Editor | Monaco Editor (same as VS Code) |
| Backend | Node.js + Express |
| AI | Google Gemini 1.5 Flash (free tier) |

## Project Structure

```
ai-code-editor/
├── backend/
│   ├── server.js        ← Express server + Gemini API integration
│   ├── .env             ← Your API key (create from .env.example)
│   ├── .env.example     ← Template for environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx          ← Main layout, editor, review logic
    │   ├── ReviewPanel.jsx  ← AI review output panel
    │   ├── main.jsx         ← React entry point
    │   └── index.css        ← Global styles (dark theme)
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Setup Instructions

### 1. Get a Gemini API Key (Free)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy the key

### 2. Configure the Backend

```bash
# Navigate to the backend folder
cd ai-code-editor/backend

# Create your .env file from the template
copy .env.example .env
```

Open `.env` and replace `your_gemini_api_key_here` with your actual key:
```
GEMINI_API_KEY=AIzaSy...your_actual_key
PORT=5000
```

### 3. Install Dependencies

```bash
# Backend
cd ai-code-editor/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Run the Project

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd ai-code-editor/backend
npm start
# ✅ Backend server running at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd ai-code-editor/frontend
npm run dev
# → Open http://localhost:5173 in your browser
```

## How It Works

1. You write/paste code in the Monaco Editor
2. Click **"✨ Review Code"**
3. Frontend sends `POST /api/review` with `{ code, language }` to the backend
4. Backend crafts a detailed prompt and calls the **Gemini API**
5. Gemini returns a markdown-formatted code review
6. The review is rendered in the right panel with syntax highlighting

## Example API Request

```bash
curl -X POST http://localhost:5000/api/review \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function add(a, b) { return a + b }",
    "language": "javascript"
  }'
```

**Example Response:**
```json
{
  "review": "## Code Review\n\n### ✅ Overall\nThe function is simple and correct...\n\n### 💡 Suggestions\n- Add JSDoc comments..."
}
```

## Supported Languages

JavaScript, TypeScript, Python, Java, C++, Go, Rust, CSS, HTML
(easily extendable in `frontend/src/App.jsx`)
