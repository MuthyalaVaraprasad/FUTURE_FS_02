# FutureCRM - Intelligent Client Lead Management System (Mini CRM)

🚀 **Live Production URL:** [https://crm-five-puce.vercel.app/](https://crm-five-puce.vercel.app/)

Welcome to **FutureCRM**, a high-fidelity, visually stunning Client Lead Management System (Mini CRM) built as a full-stack MERN-style web application and deployed as a serverless monorepo on Vercel. The application is styled with a premium **3D Portfolio & Glassmorphic** theme featuring dynamic mouse parallax tilts, connecting network particle backgrounds, real-time metrics gauges, and active 3D view transitions.

Designed for freelancers, digital agencies, and startups, FutureCRM streamlines client ingestion, deal stage transitions, follow-up calendars, note tracking, and financial projections.

---

## 🚀 Quick Start (1-Click Run on Windows)

If you are on Windows, simply double-click the **`run.bat`** file in the root of the repository. This batch file will automatically:
1. Install all dependencies for the root coordinator, Express server, and React client.
2. Launch the backend API server on [http://localhost:5000](http://localhost:5000).
3. Launch the Vite + React client on [http://localhost:5173](http://localhost:5173).

---

## 🛠️ Local Installation & Launch

To install dependencies and start both the frontend and backend servers locally, run the following commands from the root directory:

### 1. Install all dependencies
```bash
npm run install:all
```
*(This installs root packages, backend packages, and frontend packages automatically).*

### 2. Start in Development Mode
```bash
npm run dev
```
*(Runs both the React client on port 5173 and Node/Express server on port 5000 concurrently).*

---

## 🔐 Default Admin Credentials

Access the protected metrics dashboard using the pre-seeded admin account:
*   **Username:** `admin`
*   **Password:** `admin123`

---

## 💎 Premium Features Implemented

### 🎨 1. 3D Visuals & Transitions (Animations)
*   **3D Perspective Page Flips:** Wraps the main view coordinator. When switching dashboards, the main viewport performs a **3D perspective tilt & scale rotation** (`rotateY(-12deg) scale(0.96) translateZ(-50px) ➔ Y(0deg) scale(1) translateZ(0)`), creating a premium app flip transition.
*   **3D Micro-interactions (Click feedback):**
    *   *Cards & Panels:* Active cards trigger a 3D Z-push transform (`translateZ(-8px) rotateX(1deg) rotateY(-1deg)`).
    *   *Buttons:* Click feedback scale pushes (`scale(0.95) translateZ(-4px)`).
    *   *AI Floating Action Button:* Rotates on click for tactile click confirmation.
*   **3D Mouse-Tilt Cards:** Lead metrics panels and Kanban cards tilt in 3D perspective based on the mouse's relative coordinate position (custom event listeners).
*   **HTML5 Particle Backdrops:** An interactive constellation network floating in the background, drawing connecting nodes dynamically based on distance metrics.
*   **Theme Customization Engine:** Toggle between three curated presets inside the Settings page:
    *   *Neon Cyberpunk (Dark)*: High-impact dark backdrop with glowing pink/cyan badges.
    *   *Glass Light (Light)*: Translucent frosted white design with violet accent tones.
    *   *Slate Blue (Navy)*: High-performance steel blue palette.

### 🤖 2. Global Floating AI Assistant Drawer (41+ Features)
A fixed action button (FAB) `🤖` positioned at the bottom-right of the viewport triggers the sliding panel, hosting:
*   **AI Chat (15 features):** Canned queries (hottest lead, CRM health, overdue task, summaries, active count), query text parser, and action buttons (`[ Analyze Leads ]`, `[ Generate Email ]`, `[ Predict Conversion ]`, `[ AI Reports ]`, `[ Smart Search ]`).
*   **Insights (10 features):** Win score rates (High Chance ➔ Medium ➔ Low), BANT budget status, recommendations, CRM Health (94%), response speed (1.8 hours), and alerts status.
*   **Outreach (5 features):** Drafts tailored copy for *Welcome*, *Follow-up*, *Meeting Reminder*, *Proposal*, and *Thank You* emails.
*   **Summarizer (4 features):** Outline summary text, budget targets, service interests, and next actions.
*   **Reports (5 features):** Exporters for *Weekly*, *Monthly*, *Sales Summary*, *Ingestion Channels*, and direct download links.
*   **Utility (2 features):** Close buttons and context switcher dropdown.

### ⚙️ 3. Settings & Dashboard Architecture
FutureCRM features 7 distinct dashboard modules (Executive, Kanban, Lead List, Analytics, Settings, Profile, & Security):
*   **Profile Details Form:** Edit admin name, billing email, and contact phone.
*   **Profile Completeness Progress Circle:** Visual indicator tracking complete admin profile details.
*   **Change Password Form:** Update database passwords with confirmation matching rules.
*   **Active Login Sessions Log:** Audits active sessions list, tracking IPs, browsers, systems, and locations.
*   **Global Currency Sign Converter:** Instantly switch currencies across the entire application (USD, EUR, GBP, INR).
*   **Target Sales Goal Tracker:** Adjust target metrics to calculate pipeline achievement percentages.
*   **Database JSON Backup Exporter:** Download lead database records locally.
*   **SQLite Database Operations:** Seed SQLite database or wipe leads.
*   **Server Health Panel:** Monitors CPU/Memory performance status on the backend.

### 🔄 4. Unified Back Navigation
*   **Instant Back Button:** Every dashboard includes a styled `← Back to Executive Dashboard` button at the top, simplifying app navigation and returns.

---

## 📁 Repository Structure

```
FUTURE_FS_02/
├── vercel.json                # Unified monorepo deployment config for Vercel
├── package.json               # Root manager for concurrent local execution
├── README.md                  # Detailed walkthrough & setup guides
├── run.bat                    # Windows 1-click startup automation batch script
├── backend/                   # Node.js + Express API Server
│   ├── package.json           # Backend dependencies configuration
│   ├── server.js              # API bootloader & serverless exports
│   ├── database.js            # Pure JS JSON-backed Database Emulator
│   └── routes/
│       ├── auth.js            # Router for logins
│       └── leads.js           # Router for CRUD, timelines, notes, & metrics
└── frontend/                  # React + Vite client app
    ├── package.json           # Client bundler configuration
    ├── index.html             # Document index template
    ├── vite.config.js         # Vite compilation options
    └── src/
        ├── main.jsx           # App mounting bootstrap
        ├── App.jsx            # Main states & view coordinator
        ├── index.css          # Theme CSS variables, 3D animations
        ├── services/
        │   └── api.js         # API Fetch module mapping Express routes
        └── components/
            ├── Icons.jsx             # Animated inline vector SVGs
            ├── Navbar.jsx            # Responsive navigation bar
            ├── Dashboard.jsx         # 3D stat layout containing Canvas charts
            ├── Kanban.jsx            # Drag-and-drop pipeline board
            ├── LeadTable.jsx         # Table grid, bulk triggers & wizards
            ├── LeadDrawer.jsx        # Sidebar history logs & notes logs
            ├── LoginForm.jsx         # Access portal
            ├── GoalTracker.jsx       # Target goals radial progress
            ├── Toast.jsx             # Floating alerts popup
            ├── AiAssistant.jsx       # Global Floating AI Assistant Drawer
            └── ParticleBackground.jsx # HTML5 Canvas particle backdrop
```

---

## 🔌 API Endpoints Reference

### Public Endpoints
*   `POST /api/leads/submit`: Ingests public website contact inquiries.

### Authenticated Endpoints (Requires `Authorization: Bearer <JWT_token>`)
*   `POST /api/auth/login`: Verifies user login and returns JWT.
*   `GET /api/auth/me`: Verifies active JWT credentials.
*   `GET /api/leads`: Retrieves leads (supports `search`, `status`, `source`, `sort_by`, `order`).
*   `POST /api/leads`: Manually appends a new lead.
*   `PUT /api/leads/:id`: Modifies a lead details (logs audit changes).
*   `DELETE /api/leads/:id`: Deletes a lead profile.
*   `GET /api/leads/:id/notes`: Lists notes logged on a lead.
*   `POST /api/leads/:id/notes`: Logs a new note.
*   `DELETE /api/leads/:id/notes/:noteId`: Removes a note.
*   `GET /api/leads/:id/timeline`: Lists audit logs for a lead.
*   `GET /api/dashboard/stats`: Returns analytics dashboard aggregations.
*   `POST /api/leads/bulk-delete`: Bulk deletes leads.
*   `POST /api/leads/bulk-update`: Bulk updates lead statuses.
*   `POST /api/leads/bulk-import`: Parses and batch-imports leads.
*   `POST /api/leads/mock-seed`: Resets database and seeds 15 mock leads.
