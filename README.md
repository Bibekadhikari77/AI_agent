<img width="1832" height="970" alt="image" src="https://github.com/user-attachments/assets/794c2219-d25e-4fea-8010-9da5ea3a2512" />

<div align="center">
  <img src="./frontend/public/aria-icon.svg" width="100" alt="ARIA Logo" />
  
  # ARIA — AI Desktop Agent
  
  **Adaptive Reasoning & Intelligence Agent**  
  A powerful MERN-stack AI desktop assistant with voice control, local automation, and document generation.
  
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
  [![Electron](https://img.shields.io/badge/Electron-Desktop-47848F.svg)](https://www.electronjs.org/)
  [![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-black.svg)](https://openai.com/)
  [![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-lightgrey.svg)](https://socket.io/)
</div>

<br />

## 🌟 Overview

ARIA is an advanced AI desktop agent designed to automate tasks, generate files, and act as a smart assistant directly on your machine. Built on the MERN stack and wrapped in Electron, ARIA features real-time voice interaction, long-term memory, system-level application control, and dynamic file generation.

## ✨ Core Features

- **🎙️ Voice & Chat Interface**: Talk to ARIA using your microphone. Voice uses browser Speech Recognition when available (fast, no server-side transcription required) and falls back to uploading audio to the backend when needed.
- **🌐 Desktop App Automation**: Instruct ARIA to open applications or websites instantly (e.g., "Open YouTube", "Take me to WhatsApp").
- **📄 Advanced File Generation**: 
  - **Excel (.xlsx)**: Generates stylized spreadsheets with dynamic data.
  - **PDF**: Generates custom-branded PDF documents and reports.
  - **Word (.docx)**: Creates properly formatted Word documents.
- **🧠 Persistent AI Memory**: ARIA learns your preferences over time and stores them in a MongoDB-backed memory store.
- **⚡ Real-time Socket Integration**: Powered by Socket.IO to provide real-time UI updates (thinking indicators, automation progress, notification delivery).
- **📊 Analytics Dashboard**: Track your automations, file generations, and AI usage visually with Recharts.
- **💻 Electron Desktop Shell**: Run as a native Linux/Windows/Mac desktop app with system tray and background support.
- **🎨 Modern Aesthetic UI**: Glassmorphism, animated micro-interactions (Framer Motion), and a premium dark-mode tailored interface.

---

## 📂 Project Structure

This is a Monorepo workspace containing three main modules:

```text
ai_agent/
├── backend/            # Express REST API & Socket server
│   ├── controllers/    # API logic (agent, files, memory, auth)
│   ├── models/         # MongoDB schemas (User, Conversation, Memory)
│   ├── services/       # Core business logic (OpenAI/Gemini, File Generation)
│   └── server.js       # Entry point
├── frontend/           # React + Vite web application
│   ├── src/
│   │   ├── components/ # Chat interface, Sidebar, Modals
│   │   ├── pages/      # Dashboard, Memory, Settings, Files
│   │   ├── store/      # Zustand state management
│   │   └── styles/     # Global CSS variables and design system
├── electron/           # Electron desktop wrapper
│   ├── main.js         # Desktop window, IPC handlers, system tray
│   └── preload.js      # Context bridge for secure React-Electron comms
└── package.json        # Root workspace manager
```

---

## 🚀 Getting Started

Follow these steps to run the application professionally in your local development environment.

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB** (running locally on port `27017` or via MongoDB Atlas)
- **An AI API key**:
  - **Gemini API Key** (recommended if you want to avoid OpenAI quota issues), or
  - **OpenAI API Key**

### 2. Installation
Clone the repository and install all dependencies for the root, backend, frontend, and electron.

```bash
git clone <repository-url>
cd AI_agent

# The root package.json has a script to install everything at once
npm run install:all
```

### 3. Environment Configuration
Copy the `.env.example` file to `.env` in the root directory and add your credentials:

```bash
cp .env.example .env
```

Open `.env` and fill in your details:
```env
MONGODB_URI=mongodb://localhost:27017/ai_agent_db
JWT_SECRET=your_secure_jwt_secret

# Provider selection: openai | gemini
AI_PROVIDER=gemini

# Gemini (Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# (Optional) OpenAI (used if AI_PROVIDER=openai; also used by voice upload transcription if you keep that path)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
```

### 4. Running the Development Server
You can launch the full stack (Frontend & Backend) simultaneously using the root package runner:

```bash
# Starts both Express (port 5000) and Vite (port 5173) concurrently
npm run dev
```

Note: If you start only the frontend, you will see Vite proxy errors (`ECONNREFUSED 127.0.0.1:5000`) until the backend is running.

### 5. Running as a Desktop App (Electron)
To experience ARIA as a native desktop application, open a new terminal window and run:

```bash
# Ensures frontend/backend are running, then launches Electron
npm run electron:dev
```

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 with Vite for lightning-fast HMR.
- **State Management**: Zustand (Auth, Chat, Socket stores with persistence).
- **Styling**: Pure CSS with Custom Properties for maximum performance and complete control over the glassmorphic design.
- **Animations**: Framer Motion.
- **Routing**: React Router v6.

### Backend
- **Server**: Node.js & Express.js.
- **Database**: MongoDB with Mongoose ODM.
- **Real-time**: Socket.IO for duplex communication.
- **File Processing**: 
  - `exceljs` (Excel)
  - `pdfkit` (PDFs)
  - `docx` (Word documents)
  - `multer` (Voice buffer handling)
- **AI Integration**:
  - `@google/genai` (Gemini)
  - `openai` (OpenAI)

### Desktop
- **Shell**: Electron.js
- **Persistence**: `electron-store` for retaining window bounds and preferences.

---

## 📝 Usage Examples

Once logged in, try these prompts in the chat:

- **Browser Automation**: *"Open YouTube"* or *"Take me to my Gmail"*
- **Data Generation**: *"Generate an Excel spreadsheet for a Q3 Marketing Budget with 5 rows"*
- **Document Creation**: *"Write a 3-paragraph PDF document explaining Quantum Computing"*
- **Memory Storage**: *"Remember that I prefer responses in Spanish"* or *"My favorite color is Blue"*
- **Voice**: Click the microphone icon to speak naturally.

---

## 🔧 Production Deployment

To build the project for production:

1. **Build the Frontend**:
   ```bash
   npm run build
   ```
   This compiles the React app into the `frontend/dist` directory.

2. **Package the Desktop App**:
   ```bash
   cd electron
   npm run build
   ```
   This utilizes `electron-builder` to generate `.AppImage` (Linux), `.exe` (Windows), or `.dmg` (Mac) installers in the `electron/release` folder.

   Notes:
   - The Electron build bundles the frontend `dist` output and loads it in production mode.
   - In development, Electron points at `http://localhost:5173`, so the frontend dev server must be running.

3. **Deploying the Web Version**:
   - Host the `backend` on Render, Heroku, or an AWS EC2 instance.
   - Host the `frontend/dist` on Vercel or Netlify.
   - Ensure the `.env` `FRONTEND_URL` is updated on the server to handle CORS correctly.

---

<div align="center">
  <i>Developed with ❤️ for the future of AI automation.</i>
</div>
