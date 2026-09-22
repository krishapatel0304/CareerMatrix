# AI-Powered Job Application Tracker and Cover Letter Generator

Full-stack web application for tracking job applications and generating AI-powered cover letters.

## Tech Stack

- **Frontend:** React (Vite), Bootstrap, React Router
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Auth:** JWT, bcryptjs
- **AI:** Google Gemini API

## Project Structure

```
CareerMatrix/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route pages
│       ├── context/        # React context providers
│       ├── services/       # API service layer
│       ├── hooks/          # Custom React hooks
│       ├── App.jsx
│       └── main.jsx
└── server/                 # Express backend
    ├── config/             # DB config & schema
    ├── controllers/        # Route handlers
    ├── middleware/         # JWT auth middleware
    ├── routes/             # API routes
    ├── services/           # Gemini & external services
    ├── server.js
    └── .env
```

## Setup

### 1. PostgreSQL

Create the database and run the schema:

```bash
createdb careermatrix
psql -U postgres -d careermatrix -f server/config/schema.sql
```

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env with your DB credentials, JWT_SECRET, and GEMINI_API_KEY
npm install
npm run dev
```

Server runs at `http://localhost:5000`

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

App runs at `http://localhost:5173`

## API Endpoints (planned)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/jobs` | List user's jobs |
| POST | `/api/jobs` | Create job |
| PUT | `/api/jobs/:id` | Update job |
| DELETE | `/api/jobs/:id` | Delete job |
| POST | `/api/cover-letter/generate` | Generate cover letter |
