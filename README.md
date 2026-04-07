# PathPilot

PathPilot is a full-stack student productivity and career guidance platform. It combines goal tracking, focus sessions, career exploration, wellness logging, gamification, and AI-powered tools in one project.

## Core Features

- User authentication with profile management
- Goal tracking with progress, priority, status, and summary APIs
- Pomodoro and focus session logging with history and stats
- Career explorer with searchable career paths and saved careers
- Career quiz and skill-gap analysis
- AI-powered weekly reports, career chat support, and resume generation
- Roadmap builder with milestone tracking
- Wellness tracker for mood, energy, stress, and sleep
- Leaderboard, XP, badges, and notifications

## Tech Stack

### Frontend

- HTML
- CSS
- Vanilla JavaScript

### Backend

- Python
- Flask
- JWT authentication
- REST-style API endpoints

### Database

- PostgreSQL

### AI and Documents

- Google Gemini API for AI-assisted features
- ReportLab for PDF resume export

## Project Structure

```text
pathpilot/
|- backend/
|  |- app.py
|  |- init_db.py
|  |- controllers/
|  |- routes/
|  |- middleware/
|  |- models/
|  |- config/
|  `- database/
|- frontend/
|  |- index.html
|  |- dashboard.html
|  |- career.html
|  |- focus.html
|  |- wellness.html
|  |- roadmap.html
|  |- leaderboard.html
|  |- ai.html
|  |- css/
|  `- js/
`- README.md
```

## Pages Included

- `frontend/index.html` - landing page with login and registration
- `frontend/dashboard.html` - student dashboard
- `frontend/career.html` - career explorer and quiz flow
- `frontend/focus.html` - focus timer and session history
- `frontend/wellness.html` - daily wellness tracking
- `frontend/roadmap.html` - roadmap and milestone progress
- `frontend/leaderboard.html` - leaderboard and ranking view
- `frontend/ai.html` - AI tools

## Backend API Modules

The Flask app registers the following route groups:

- `/api/auth`
- `/api/goals`
- `/api/career`
- `/api/focus`
- `/api/wellness`
- `/api/leaderboard`
- `/api/notifications`
- `/api/ai`
- `/api/roadmap`

Health check:

```text
GET /api/health
```

## Local Setup

### 1. Clone the project

```bash
git clone <your-repo-url>
cd pathpilot
```

### 2. Create a backend environment file

Create `backend/.env` with values like these:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pathpilot_db
DB_USER=postgres
DB_PASSWORD=postgres
SECRET_KEY=pathpilot_dev_secret_change_in_prod
JWT_EXPIRY_HOURS=24
DEBUG=True
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
```

Notes:

- `GEMINI_API_KEY` is optional. If it is missing, the app falls back to basic built-in responses for AI features.
- Set `DB_PORT` explicitly to match your PostgreSQL installation.

### 3. Install backend dependencies

On Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

On macOS/Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Initialize the database

Make sure PostgreSQL is running, then run:

```bash
python init_db.py
```

This script creates the database if needed, applies `backend/database/schema.sql`, and loads seed data from `backend/database/seed.sql`.

### 5. Start the backend server

```bash
python app.py
```

Backend default URL:

```text
http://127.0.0.1:5000
```

### 6. Start the frontend

Open a second terminal:

```bash
cd frontend
python -m http.server 5500
```

Frontend URL:

```text
http://127.0.0.1:5500/index.html
```

## Frontend API Configuration

The frontend currently points to this backend base URL in `frontend/js/api.js`:

```js
const API = "http://127.0.0.1:5000/api";
```

If you change the backend host or port, update this value.

## Database Overview

The schema includes tables for:

- users
- goals
- career_paths
- saved_career_paths
- roadmaps
- roadmap_milestones
- focus_sessions
- mood_entries
- quiz_questions
- quiz_results
- notifications
- badges
- user_badges
- weekly_reports

## Useful Docs In This Repo

- `ARCHITECTURE.md`
- `ARCHITECTURE_IMPROVEMENTS.md`
- `IMPLEMENTATION_COMPLETE.md`
- `QUICK_TEST_GUIDE.md`
- `CODE_CHANGES_REFERENCE.md`

## Common Troubleshooting

### Backend cannot connect to PostgreSQL

- Confirm PostgreSQL is running
- Confirm the values in `backend/.env`
- Make sure the database user has permission to create and access `pathpilot_db`

### Frontend shows fetch or CORS errors

- Make sure the Flask backend is running on the same URL used in `frontend/js/api.js`
- Start the frontend with a local server instead of opening HTML files directly

### AI features are not working

- Add a valid `GEMINI_API_KEY` to `backend/.env`
- Restart the backend after updating environment variables

## Status

This repository already includes:

- backend API code
- database schema and seed files
- multi-page frontend
- AI resume PDF generation support

## Author

Ganesh Chendke

## License

This project is currently provided for educational and portfolio use.
