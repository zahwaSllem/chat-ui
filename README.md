# Chat Zahwa

A React chat interface connected to a Node.js AI agent powered by Google Gemini. The agent can call tools to get the **current time** and **live weather** for any city, so it answers with real data instead of guessing.

The UI is right-to-left and in Arabic. The assistant, "Nour", replies in the same language the user writes in, including Egyptian Arabic.

## Features

**Frontend (`chat-ui`)**
- Chat interface with Markdown rendering for replies
- Automatically scrolls to the latest message
- Typing indicator (three animated dots) while waiting for a reply
- "New Chat" button to clear the conversation
- Conversation saved in `localStorage`, so it survives a page refresh
- Light and dark mode (follows the system setting by default and remembers your choice)

**Backend (`my-agent`)**
- Express server with a single `POST /chat` endpoint
- Gemini model (`gemini-3.1-flash-lite`) with a system prompt that defines the assistant's personality
- An agent loop: when the model asks for a tool, the server runs it, sends the result back, and repeats until the model gives a final answer
- Tools:
  - `getCurrentTime`: returns the server's local time
  - `getWeather(city)`: looks up the city with the [Open-Meteo](https://open-meteo.com/) geocoding API and returns the current temperature and wind speed (no API key needed)

## How it works

```
┌────────────┐   POST /chat    ┌──────────────┐   generateContent   ┌────────┐
│  React UI  │ ──────────────▶ │ Express API  │ ──────────────────▶ │ Gemini │
│ (port 5173)│ ◀────────────── │ (port 3001)  │ ◀────────────────── │        │
└────────────┘   { reply }     └──────┬───────┘   text / tool call  └────────┘
                                      │
                                      ▼ tool call?
                              getCurrentTime / getWeather ──▶ Open-Meteo
```

1. The UI sends the whole conversation to the server as `{ messages: [{ role, text }, ...] }`.
2. The server converts it to Gemini's format and calls the model with the tool declarations.
3. If Gemini returns a function call, the server runs the tool, adds the result to the conversation, and calls Gemini again.
4. When Gemini returns plain text, the server responds with `{ reply }` and the UI shows it.

## Project structure

The two projects sit side by side:

```
chat-ui/                 # React frontend (Vite)
  src/
    App.jsx              # Chat logic: sending, auto-scroll, localStorage, theme
    App.css              # Styles and light/dark theme variables
    main.jsx
my-agent/                # Node.js backend
  server.js              # Express server, Gemini agent loop, and tools
  agent.js               # Standalone command-line example of the agent loop
  index.js               # Minimal "hello Gemini" example
  .env                   # GEMINI_API_KEY (not committed)
```

## Getting started

### Requirements

- Node.js 20.6 or newer (the server uses `node --env-file`)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Start the backend

```bash
cd my-agent
npm install
```

Create a `.env` file in `my-agent`:

```env
GEMINI_API_KEY=your_api_key_here
```

Then start the server:

```bash
npm start
```

The server runs on `http://localhost:3001`. Opening that address in a browser should show "Server is working!".

### 2. Start the frontend

In a second terminal:

```bash
cd chat-ui
npm install
npm run dev
```

Open the address Vite prints (usually `http://localhost:5173`).

### Try it

- "كام الساعة دلوقتي؟" (What time is it now?)
- "What's the weather in Cairo?"
- "الجو عامل إيه في الإسكندرية؟" (How's the weather in Alexandria?)

The server terminal logs each tool call, for example `Agent is using tool: getWeather { city: 'Cairo' }`.

## API

### `POST /chat`

Request:

```json
{
  "messages": [
    { "role": "user", "text": "What's the weather in Cairo?" }
  ]
}
```

`role` is `"user"` or `"model"`.

Response:

```json
{ "reply": "It's currently 31°C in Cairo with wind at 12 km/h." }
```

On error, the server returns status `500` with an Arabic error message in `reply`.

## Adding a new tool

In `my-agent/server.js`:

1. Write the function, for example `async function getNews(topic) { ... }`.
2. Add its declaration (name, description, parameters) to the `tools` array.
3. Handle it in `runTool`: `if (name === "getNews") return await getNews(args.topic);`

Gemini will start calling it whenever a question needs it.

## Scripts

| Location   | Command         | What it does                           |
| ---------- | --------------- | -------------------------------------- |
| `chat-ui`  | `npm run dev`   | Start the Vite dev server              |
| `chat-ui`  | `npm run build` | Build the frontend for production      |
| `chat-ui`  | `npm run lint`  | Lint with Oxlint                       |
| `my-agent` | `npm start`     | Start the API server (restarts on file changes) |

## Tech stack

- **Frontend:** React 19, Vite, react-markdown
- **Backend:** Node.js, Express 5, `@google/genai`, cors
- **Data:** Open-Meteo (weather and geocoding)
