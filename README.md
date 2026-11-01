# Campus Skill Exchange

> A peer-to-peer skill sharing and learning platform built for VESIT (Vivekanand Education Society's Institute of Technology) students.

---

## Project Overview

**Campus Skill Exchange** is a full-stack web application that enables students across the same campus to **offer their skills**, **request to learn from peers**, and **schedule teaching sessions** — all within a secure, role-aware platform.

Students register with their Student ID, browse available skills, send exchange requests to teachers, and manage sessions through a personal dashboard. A dedicated admin view gives authorised users visibility over the entire student directory and authentication audit logs.

The frontend is built with **React 19 + Vite 6** and communicates with a separately deployed **Express + MongoDB** REST API over JWT-authenticated endpoints.

---

## Problem Statement

College campuses hold an enormous amount of untapped peer knowledge. Students often struggle to find classmates who can teach them specific skills, while skilled students have no structured way to offer or monetise their expertise. Existing academic portals do not facilitate this kind of informal, student-driven learning exchange.

---

## Project Objectives

- Provide a searchable catalogue of student-offered skills.
- Allow any registered student to send a learning request to a skill teacher.
- Enable teachers to accept or reject incoming requests.
- Facilitate session scheduling between teachers and learners.
- Maintain an audit trail of authentication events for administrators.
- Deliver a responsive experience on all screen sizes.

---

## Key Features

| Feature | Description |
|---|---|
| 📋 Skill Catalogue | Browse 12+ pre-seeded skills; more added dynamically by registered students. |
| 🔍 Search & Filter | Real-time search and category filtering (Coding, Design, Business, Communication). |
| 🔐 JWT Authentication | Secure login and registration backed by bcrypt password hashing and JSON Web Tokens. |
| 📬 Skill Requests | Students send requests to teachers; teachers accept or reject with contact sharing. |
| 📅 Session Scheduling | Date + time picker for booking confirmed learning sessions. |
| ✅ Session Tracking | Upcoming and completed session management per user. |
| 🔔 Notifications | Live pending-request badge in the navbar for teachers. |
| 🛡️ Admin Dashboard | Role-gated view: student directory, system stats, authentication log table. |
| 💾 Offline Resilience | Falls back gracefully to localStorage when backend is unreachable. |
| 🌐 API Status Indicator | Live badge in the navbar showing "API Live" or "Local Mode". |

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.3.x | UI component library |
| Vite | 6.4.x | Build tool and dev server |
| JavaScript (ES Modules) | ES2022+ | Application language |
| CSS (vanilla) | — | Custom responsive styles |

### Backend *(separately deployed — not modified by this repository)*
| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express | 4.21.x | REST API server |
| MongoDB + Mongoose | 8.24.x | Document database and ODM |
| bcryptjs | 3.0.x | Password hashing |
| jsonwebtoken | 9.0.x | JWT token generation and validation |

---

## Project Architecture

```
Browser (React SPA)
        │
        │  VITE_API_BASE_URL (HTTPS)
        ▼
Deployed Express API (server.cjs)
        │
        ▼
  MongoDB Atlas
```

The frontend is a **pure client-side Single Page Application (SPA)**. All routing is handled in React state (`page` variable). The backend (`server.cjs`) is deployed independently and is not part of this repository's build or deployment pipeline.

---

## Folder Structure

```
campus-skill-exchange/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions: install → test → build
├── client/                     # Preserved prototype (Tailwind components)
│   └── src/
│       ├── components/         # Navbar, Hero, FeatureSection, SkillCard, Footer
│       └── pages/              # Placeholder page files
├── src/                        # ← Active frontend (Vite entry point)
│   ├── api.js                  # Centralized API client + JWT header injection
│   ├── App.jsx                 # Main application (router, state, all views)
│   ├── App.css                 # Custom responsive CSS
│   ├── main.jsx                # React DOM root + ErrorBoundary mount
│   ├── components/
│   │   └── ErrorBoundary.jsx   # React error boundary with reset button
│   └── utils/
│       └── storage.js          # Safe localStorage wrapper (JSON parse guard)
├── test/
│   └── frontend-verification.cjs  # Automated build + integration verification
├── .env.example                # Environment variable template
├── .gitignore                  # Excludes node_modules, dist, .env files
├── index.html                  # Vite HTML entry point
├── package.json                # Scripts and dependencies
├── server.cjs                  # Express + MongoDB backend (not used in frontend build)
├── vercel.json                 # Vercel deployment config + SPA routing rewrites
└── vite.config.js              # Vite build configuration
```

---

## Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | 18.x (20.x recommended) |
| npm | 9.x or higher |
| Git | 2.x |

Verify your installation:

```bash
node -v
npm -v
```

---

## Local Installation

```bash
# 1. Clone the repository
git clone https://github.com/Harshikak2506/CampusSkillExchange.git
cd CampusSkillExchange

# 2. Install all dependencies (uses exact versions from package-lock.json)
npm ci
```

---

## Environment Variable Configuration

The application requires one environment variable to connect to the backend API.

```bash
# 3. Create your local environment file from the template
cp .env.example .env
```

Open `.env` and set the backend URL:

```env
# For local development (if running the backend locally):
VITE_API_BASE_URL=http://localhost:5000

# For production (replace with your actual deployed backend URL):
VITE_API_BASE_URL=https://your-deployed-backend.onrender.com
```

> **Important:** The `.env` file is excluded from Git via `.gitignore`. Never commit credentials.

If `VITE_API_BASE_URL` is not set, the frontend will attempt to reach `http://localhost:5000` and display **"○ Local Mode"** in the navbar — skills, requests, and sessions will still work using browser localStorage.

---

## Running Locally

```bash
# Start the Vite development server
npm run dev
```

The application will be available at: **http://localhost:5173**

You will also need the backend running separately for API-connected features (login, registration, student directory sync). Refer to the backend repository for backend startup instructions.

---

## Production Build

```bash
# Compile and bundle for production
npm run build
```

Output is written to `dist/`. The build is optimized, minified, and ready for static hosting.

```bash
# Preview the production build locally
npm run preview
```

Preview will be served at: **http://localhost:4173**

---

## Running Tests

```bash
npm test
```

The test suite (`test/frontend-verification.cjs`) validates:
- ✓ Production build artifacts (HTML, CSS, JS bundles)
- ✓ Safe localStorage JSON parsing and corrupted data recovery
- ✓ API URL normalization logic
- ✓ Vercel SPA routing configuration
- ✓ Environment template presence

---

## API Integration Overview

All API communication is centralized in [`src/api.js`](./src/api.js).

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/` | GET | No | Health check |
| `/api/register` | POST | No | Student registration |
| `/api/login` | POST | No | Student login + JWT issuance |
| `/api/logout` | POST | Yes | Logout + audit log entry |
| `/api/students` | GET | No | Fetch all student records |
| `/api/skills` | GET | No | Fetch all skills from DB |
| `/api/skills` | POST | Yes (JWT) | Add a new skill |
| `/api/profile` | GET | Yes (JWT) | Get authenticated user profile |
| `/api/admin/dashboard` | GET | Yes (Admin JWT) | Admin statistics + student list |
| `/api/loginlogs` | GET | No | Authentication audit log |

The API client automatically attaches the stored JWT token as an `Authorization: Bearer <token>` header to every request, reading from `localStorage`.

---

## Authentication Overview

1. **Registration:** Student provides Student ID, name, email, phone, and password. Password is hashed with bcrypt on the backend before storage. No password is ever stored on the frontend.
2. **Login:** Credentials are verified by the backend. On success, a JWT token (1-hour expiry) and student record are returned.
3. **Token Storage:** JWT is stored in `localStorage` under the key `token`.
4. **Authenticated Requests:** All subsequent API calls include the token via `Authorization: Bearer <token>`.
5. **Logout:** The backend `/api/logout` endpoint is called (which logs the event), then the token and user data are cleared from localStorage.
6. **Session Persistence:** The current user object is stored in localStorage so users remain logged in across page refreshes.

> **Security note:** Storing JWTs in localStorage exposes them to XSS attacks. This is an accepted trade-off for a college project environment. For production hardening, consider `httpOnly` cookies.

---

## User Roles

| Role | Access |
|---|---|
| `student` (default) | Browse skills, send requests, offer skills, manage sessions |
| `admin` | All student actions + Admin panel with full student directory and audit logs |

The `role` field is embedded in the JWT payload and set during registration (always `student` for self-registrations). Admin accounts must be manually elevated in MongoDB.

---

## Testing Instructions

```bash
# Run the automated build and integration test suite
npm test
```

Manual testing checklist:
- [ ] Homepage loads with hero and feature sections
- [ ] Skill search and category filtering works
- [ ] Registration form validates empty fields and shows toast errors
- [ ] Login form authenticates against the backend
- [ ] Dashboard shows correct stats for the logged-in user
- [ ] Teacher can accept/reject skill requests
- [ ] Learner can schedule a session after request is accepted
- [ ] Session date input enforces minimum date of today
- [ ] Admin tab appears only when `role === "admin"`
- [ ] Application works in offline (Local Mode) when backend is unreachable

---

## Deployment Instructions (Vercel)

### One-time Vercel setup

1. Push this repository to GitHub.
2. Log in to [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import the `CampusSkillExchange` GitHub repository.
4. Configure the following settings:

| Setting | Value |
|---|---|
| Framework Preset | `Vite` |
| Root Directory | `./` (repository root) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci` |

5. Add environment variables under **Project Settings → Environment Variables**:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://your-deployed-backend-url.com` |

6. Click **Deploy**.

The `vercel.json` file in the repository already configures SPA routing rewrites so direct URL access and browser refreshes work correctly.

---

## Troubleshooting

| Problem | Likely Cause | Solution |
|---|---|---|
| Blank screen on startup | Missing `VITE_API_BASE_URL` or build error | Check the browser console for errors; ensure `.env` is configured |
| "○ Local Mode" badge in navbar | Backend is unreachable | Verify the backend URL in `.env`; check if the backend server is running |
| Login/Registration fails | Backend offline or wrong URL | Ensure `VITE_API_BASE_URL` points to the correct backend |
| Build fails with import errors | Dependency mismatch | Run `npm ci` to restore exact dependency versions |
| 404 on page refresh (Vercel) | SPA routing not configured | Ensure `vercel.json` is present in the repository root |
| CORS error in browser console | Backend CORS policy | Ensure the backend allows requests from your Vercel deployment domain |

---

## Security Considerations

- ✅ Passwords are never stored or transmitted in plain text on the frontend.
- ✅ JWT tokens are cleared from localStorage on logout.
- ✅ API endpoints requiring authentication attach the JWT automatically.
- ✅ Role-based UI elements (Admin tab) are gated by the `role` field.
- ✅ No credentials, API keys, or secrets are committed to the repository.
- ✅ `.env` files are excluded via `.gitignore`.
- ⚠️ JWT stored in localStorage is accessible to JavaScript — appropriate for an academic project; use `httpOnly` cookies for hardened production systems.
- ⚠️ Frontend role checks are UI conveniences only; all actual authorization is enforced by the backend middleware.

---

## Future Enhancements

- [ ] Real-time notifications using WebSockets or Server-Sent Events.
- [ ] In-app messaging between students and teachers.
- [ ] Rating and review system for completed sessions.
- [ ] Google/college SSO integration.
- [ ] Skill endorsements by peers.
- [ ] Calendar integration for session scheduling.
- [ ] Email notifications for accepted or rejected requests.
- [ ] Mobile application using React Native.
- [ ] Search by teacher name in addition to skill name.
- [ ] Pagination for the skills catalogue.

---

## Contribution Guidelines

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes with a descriptive message.
4. Push to your fork and open a Pull Request against the `main` branch.
5. Ensure `npm test` and `npm run build` pass before submitting.

Please do not commit `.env` files, `dist/` output, or `node_modules/`.

---

## License

License not yet specified. All rights reserved by the project author unless otherwise stated.

---

## Project Context

This project was developed as part of the **Web Technology** lab experiments at **VESIT (Vivekanand Education Society's Institute of Technology)**. The backend experiments covered MongoDB integration (Experiment 5) and JWT authentication with role-based access control (Experiment 6).

---

*Built with ❤️ at VESIT — Campus Skill Exchange © 2026*
