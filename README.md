# DriveDeck 🚀
### The 100% Free, Privacy-First, Block-Based Workspace Powered by Google Drive

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Drive API](https://img.shields.io/badge/Google_Drive-API_v3-4285F4?logo=googledrive&logoColor=white)](https://developers.google.com/drive)
[![Offline First](https://img.shields.io/badge/Storage-IndexedDB_Offline_First-10B981)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Pricing](https://img.shields.io/badge/Pricing-100%25_Free-brightgreen)](#)

**DriveDeck** is a modern, privacy-respecting, block-based workspace designed for individuals and teams who want the flexibility of tools like Notion without surrendering their data sovereignty.

By using a **"Bring Your Own Cloud" (BYOC)** architecture, DriveDeck stores all your notes, Kanban boards, project albums, and tasks directly in your personal **Google Drive** hidden application sandbox (`appDataFolder`) and local browser **IndexedDB**. 

**No external database. No subscription fees. No tracking. Complete data ownership.**

<img width="1628" height="1003" alt="Screenshot 2026-09-18 16 57 25" src="https://github.com/user-attachments/assets/a7072d4e-299e-4145-9bdc-ac24178f9ce9" />

---

## ✨ Features

- 📝 **Modular Block Editor**
  - Rich text formatting, heading levels (H1, H2, H3), quote blocks, callouts, and dividers.
  - Interactive checklists, bullet points, and syntax-highlighted code snippets.
  - Drag-and-drop block reordering with keyboard shortcuts and inline slash `/` commands.
  - Full support for page covers, custom emojis, and breadcrumb navigation.

- 📁 **Project Albums & Workspaces**
  - Organize notes and documents into dedicated project spaces.
  - Customize each album with distinct color themes, gradient covers, and emoji icons.
  - Pin favorite projects to the sidebar for instant one-click access.

- 📌 **Interactive Sticky Notes Board**
  - Freeform, color-coded digital canvas for quick thoughts, brainstorms, and temporary memos.
  - Pin, drag, color-code, and organize notes with instant persistence.

- 📋 **Integrated Kanban Boards**
  - Visual task management with customizable columns (*To Do*, *In Progress*, *Review*, *Done*).
  - Priority badges, tags, and due-date reminders with automated status alerts.
  - Embed live Kanban boards directly inside any editor document.

- ✅ **Google Tasks Two-Way Sync**
  - Native integration with the official Google Tasks API.
  - Create, view, organize, and complete your Google Tasks without leaving your workspace.

- 🖼️ **Drive Media & Photo Integration**
  - Securely browse and embed images and documents stored in your Google Drive.
  - No file re-uploading or redundant storage usage.

- ⚡ **Offline-First & Lightning-Fast**
  - Instant page loads and zero-latency typing backed by browser IndexedDB.
  - Automatic background synchronization to Google Drive whenever you are connected.
  - Seamless offline mode — work on trains, flights, or unstable networks with zero interruptions.

- 🛡️ **Absolute Privacy & Data Sovereignty**
  - All synchronization happens encrypted directly between your browser and Google APIs.
  - No proprietary cloud databases, no analytics profiling, and no vendor lock-in.

- 💾 **One-Click JSON Data Export**
  - Download a complete, open, and machine-readable JSON backup of your entire workspace at any time.

- 🌐 **Bilingual (English & German)**
  - Full internationalization support with instant language switching in Settings.

<img width="1919" height="1019" alt="image" src="https://github.com/user-attachments/assets/16b40bb2-000f-4aa5-a700-cfde7abacf47" />

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│                                                             │
│   React 19 UI  ◄──►  IndexedDB (Local Offline Storage)       │
│         ▲                                                   │
│         │ Direct Encrypted HTTPS (OAuth 2.0 Bearer Token)   │
└─────────┼───────────────────────────────────────────────────┘
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Google Cloud Platform                     │
│                                                             │
│   • Google Drive API  ──►  appDataFolder (Private Sandbox)  │
│   • Google Tasks API  ──►  User Task Lists & Reminders      │
│   • Google Picker API ──►  File & Photo Selection           │
└─────────────────────────────────────────────────────────────┘
```

- **IndexedDB**: Serves as the primary local cache for zero-latency UI rendering and full offline availability.
- **Google Drive `appDataFolder`**: Dedicated, user-invisible application sandbox on Google Drive. It keeps your main Drive directory tidy while guaranteeing cloud backup and multi-device sync.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher recommended)
- **npm** or **yarn** / **pnpm**
- A **Google Account** (to use Google Drive and Google Tasks sync)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/drivedeck.git
cd drivedeck
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the sample environment file:

```bash
cp .env.example .env
```

Configure your optional environment keys in `.env`:

```env
# Optional Gemini AI API Key (for server-side AI features)
GEMINI_API_KEY=

# App URL (defaults to http://localhost:3000)
APP_URL="http://localhost:3000"

# Optional Custom Google Picker Credentials (if utilizing custom project keys)
VITE_GOOGLE_PICKER_API_KEY=
VITE_GOOGLE_PICKER_PROJECT_ID=
```

### 4. Run the Development Server

```bash
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`**.

---

## 🔑 Google Cloud OAuth Setup (For Custom Deployments)

To enable Google Drive and Google Tasks synchronization in your own Google Cloud project:

1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `DriveDeck Workspace`).
3. Under **APIs & Services > Library**, enable:
   - **Google Drive API**
   - **Google Tasks API**
   - **Google Picker API**
4. Under **OAuth consent screen**:
   - Set User Type to **External** (or Internal for Workspace organizations).
   - Add the scopes:
     - `https://www.googleapis.com/auth/drive.appdata`
     - `https://www.googleapis.com/auth/drive.file`
     - `https://www.googleapis.com/auth/tasks`
5. Under **Credentials > Create Credentials > OAuth client ID**:
   - Application type: **Web application**.
   - Add your domain to **Authorized JavaScript origins** (e.g., `http://localhost:3000` and `https://your-domain.com`).
   - Add your domain to **Authorized redirect URIs** (e.g., `http://localhost:3000/Willkommen` and `https://your-domain.com/Willkommen`).

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express server and Vite development server on port 3000 |
| `npm run build` | Builds the client SPA and bundles `server.ts` with esbuild |
| `npm run start` | Runs the compiled production server (`dist/server.cjs`) |
| `npm run lint` | Runs TypeScript compiler checks (`tsc --noEmit`) |
| `npm run preview` | Previews the built production static client locally |

---

## 📁 Project Structure

```
drivedeck/
├── public/                 # Favicons, static brand assets, icons
├── src/
│   ├── components/         # React UI Components
│   │   ├── Editor.tsx      # Core block-based document editor
│   │   ├── EmbeddedKanbanBlock.tsx # In-document Kanban block
│   │   ├── GoogleTasks.tsx # Google Tasks management component
│   │   ├── KanbanBoard.tsx # Fullscreen Kanban dashboard
│   │   ├── LandingPage.tsx # Hero landing page & showcase
│   │   ├── Photos.tsx      # Google Drive media gallery
│   │   ├── PrivacyPolicyPage.tsx # Legal & privacy policy
│   │   ├── SettingsPage.tsx# Settings, sync status & backup export
│   │   ├── Sidebar.tsx     # Project navigation & page tree
│   │   ├── StickyNotes.tsx # Color-coded digital sticky notes
│   │   └── TermsOfServicePage.tsx # Terms of service
│   ├── data/               # Preset covers, emojis, and styling palettes
│   ├── lib/                # Services, API clients, and storage
│   │   ├── db.ts           # IndexedDB persistence layer
│   │   ├── driveSync.ts    # Google Drive REST API synchronization
│   │   ├── googleAuth.ts   # Google Identity Services / Firebase Auth
│   │   ├── googleTasksClient.ts # Google Tasks API integration
│   │   ├── LanguageContext.tsx  # i18n localization engine (EN / DE)
│   │   └── notificationService.ts # Due date alert watcher
│   ├── types.ts            # Central TypeScript interfaces & data models
│   ├── App.tsx             # Root application orchestrator
│   └── main.tsx            # React DOM entry point
├── server.ts               # Express backend & Vite middleware server
├── metadata.json           # App permissions and metadata
├── vite.config.ts          # Vite bundler configuration
└── package.json            # Project dependencies & build scripts
```

---

## 🔒 Privacy & Security First

- **Zero Tracking**: DriveDeck has no tracking scripts, advertising SDKs, or data broker telemetry.
- **Your Data Remains Yours**: Content is stored in your local browser and your personal Google Drive account. No third-party database is used.
- **Completely Free**: No subscription plans, no paywalls, no trial limits. DriveDeck is built for users who value freedom and privacy.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for personal and commercial use.

---

<div align="center">
  <sub>Built with ❤️ for a private, decentralized, and sovereign web workspace.</sub>
</div>
