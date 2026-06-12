# CineAssist — Full Stack Edition

AI-powered shot composition analysis with social features, user accounts, storyboarding, and pro tools.

## Architecture

```
cineassist-full/
├── backend/               Node.js + Express REST API
│   └── src/
│       ├── config/        Database, Cloudinary, migrations
│       ├── controllers/   Auth, Analysis, Social, Challenges, Sequences
│       ├── middleware/     JWT auth, file upload
│       ├── routes/        All API routes
│       └── services/      Claude Vision AI service
├── frontend/              React + Vite SPA
│   └── src/
│       ├── components/
│       │   ├── analyzer/  Upload, canvas, scores, feedback, detail
│       │   ├── auth/      Login/register modal
│       │   ├── dashboard/ Portfolio, score history chart
│       │   ├── layout/    Navbar, Footer, Hero, HomePage
│       │   ├── pro/       A/B Compare, Storyboard builder
│       │   └── social/    Explore feed, leaderboard, challenges, profiles
│       ├── services/      api.js — all fetch calls
│       ├── store/         AuthContext
│       └── utils/         analyzer.js, overlayRenderer.js, exportPDF.js
└── docker-compose.yml
```

## Features

### AI/ML
- **6-module client-side analysis** — Rule of Thirds, Balance, Symmetry, Color Harmony, Brightness, Leading Lines
- **Claude Vision API** — natural language feedback, genre/mood classification, recomposition suggestions
- **A/B Shot Comparison** — AI-powered side-by-side cinematographic analysis

### User Accounts
- JWT authentication (register/login)
- Portfolio dashboard with saved analyses
- Score trend chart over time (Recharts)
- Follow other photographers

### Social
- Public explore feed (sort by newest/top/popular, filter by genre)
- User profiles with follower/following counts
- Likes and threaded comments on analyses
- Leaderboard (best score / avg score / most active)

### Pro Tools
- **A/B Comparison** — compare two of your shots side-by-side with AI verdict
- **Storyboard Builder** — drag shots into sequences, arrange film timelines
- **PDF Export** — full analysis report with scores, AI feedback, and suggestions

### Challenges
- Weekly composition challenges with themes
- Submit shots, earn community votes
- Per-challenge leaderboard

## Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ (or Docker)
- Cloudinary account (free tier works)
- Anthropic API key

### 1. Clone & configure

```bash
cd backend
cp .env.example .env
# Fill in your keys in .env
```

### 2. Start database

```bash
# Option A: Docker
docker compose up postgres -d

# Option B: Local PostgreSQL
createdb cineassist
```

### 3. Run migrations

```bash
cd backend
npm install
npm run db:migrate
```

### 4. Start backend

```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

### 5. Start frontend

```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

### Full Docker stack

```bash
# Copy and fill in backend/.env first
docker compose up --build
```

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Sign in, returns JWT |
| GET | /api/auth/me | ✓ | Current user profile |
| POST | /api/analyses | ✓ | Upload + save analysis (multipart) |
| GET | /api/analyses/me | ✓ | Your analyses (paginated) |
| GET | /api/analyses/feed | — | Public explore feed |
| GET | /api/analyses/history | ✓ | Score history for charts |
| POST | /api/analyses/compare | ✓ | AI A/B comparison |
| GET | /api/analyses/:id | — | Single analysis detail |
| POST | /api/analyses/:id/like | ✓ | Toggle like |
| GET | /api/social/leaderboard | — | Rankings |
| GET | /api/social/feed | ✓ | Following feed |
| POST | /api/users/:id/follow | ✓ | Follow/unfollow |
| GET | /api/challenges | — | Active challenges |
| POST | /api/challenges/:id/submit | ✓ | Submit shot |
| POST | /api/sequences | ✓ | Create storyboard |

## Environment Variables

```env
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
ANTHROPIC_API_KEY=sk-ant-...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=http://localhost:5173
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Recharts, jsPDF |
| Backend | Node.js, Express 4, PostgreSQL 16 |
| AI | Anthropic Claude Vision API (claude-opus-4-5) |
| Storage | Cloudinary (image hosting) |
| Auth | JWT + bcrypt |
| Dev | Vite, Docker Compose, Nodemon |

## License

Apache 2.0
