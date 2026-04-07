# PathPilot

PathPilot is a full-stack student productivity and career guidance platform built to help students stay focused, plan goals, explore careers, manage wellness, and use AI tools from one dashboard.

## Highlights

- Secure authentication and profile management
- Goal tracking with progress, priority, deadlines, and summary stats
- Focus session tracking with Pomodoro-style study logs
- Career explorer with saved paths and skill-gap analysis
- AI career chat, weekly reports, and resume generation
- Learning roadmap builder with milestone tracking
- Wellness tracking for mood, stress, energy, and sleep
- Leaderboard, badges, XP, and notifications

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Python, Flask, JWT auth
- Database: PostgreSQL
- AI: Google Gemini via `google-genai`
- PDF: ReportLab

## Project Structure

```text
pathpilot/
|- backend/
|  |- app.py
|  |- init_db.py
|  |- config/
|  |- controllers/
|  |- database/
|  |- middleware/
|  |- models/
|  |- routes/
|  |- utils/
|  `- requirements.txt
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

## Main Pages

- `frontend/index.html` - landing page with login and registration
- `frontend/dashboard.html` - overview dashboard
- `frontend/career.html` - career explorer and quiz
- `frontend/focus.html` - focus timer and session history
- `frontend/wellness.html` - wellness logging and insights
- `frontend/roadmap.html` - roadmap planning and milestones
- `frontend/leaderboard.html` - rankings and gamification
- `frontend/ai.html` - AI tools and resume builder

## API Modules

The backend exposes these route groups:

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

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/ganeshchendke0/PathPilot.git
cd PathPilot
```

### 2. Create the backend environment file

Create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pathpilot_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
SECRET_KEY=change_this_secret_key
JWT_EXPIRY_HOURS=24
DEBUG=True
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Optional:

```env
GEMINI_MODEL_CANDIDATES=gemini-2.5-flash,gemini-2.0-flash
```

Notes:

- `GEMINI_API_KEY` enables AI chat, weekly reports, roadmap generation, and resume generation.
- If `GEMINI_MODEL` is unavailable, the backend can fall back to values from `GEMINI_MODEL_CANDIDATES`.
- If no Gemini key is set, the app returns built-in fallback responses for AI features.

### 3. Install backend dependencies

Windows PowerShell:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS/Linux:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Initialize the database

Make sure PostgreSQL is running, then run:

```bash
python init_db.py
```

This will create the database if needed, apply `backend/database/schema.sql`, and seed initial data from `backend/database/seed.sql`.

### 5. Start the backend

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

## Frontend API Base URL

The frontend uses this API base in `frontend/js/api.js`:

```js
const API = "http://127.0.0.1:5000/api";
```

If you run the backend on a different host or port, update this value.

## Important Backend Dependencies

The backend currently uses:

- `flask`
- `psycopg2-binary`
- `python-dotenv`
- `PyJWT`
- `bcrypt`
- `google-genai`
- `reportlab`

## Database Tables

The schema includes:

- `users`
- `goals`
- `career_paths`
- `saved_career_paths`
- `roadmaps`
- `roadmap_milestones`
- `focus_sessions`
- `mood_entries`
- `quiz_questions`
- `quiz_results`
- `notifications`
- `badges`
- `user_badges`
- `weekly_reports`

## Troubleshooting

### PostgreSQL connection error

- Make sure PostgreSQL is running
- Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in `backend/.env`
- Confirm the PostgreSQL user has permission to create and access `pathpilot_db`

### Frontend cannot fetch backend data

- Make sure the backend server is running
- Make sure the frontend is opened through `python -m http.server`, not by double-clicking the HTML file
- Confirm `frontend/js/api.js` points to the correct backend URL

### Gemini AI is not responding

- Make sure `GEMINI_API_KEY` is valid
- Restart the backend after changing `.env`
- Try setting:

```env
GEMINI_MODEL=gemini-2.0-flash
```

- Or configure:

```env
GEMINI_MODEL_CANDIDATES=gemini-2.5-flash,gemini-2.0-flash
```

### Git push fails with `Could not resolve host: github.com`

- Check your internet connection
- Flush DNS with `ipconfig /flushdns`
- Verify proxy settings with `git config --global --get http.proxy`
- Retry after reconnecting Wi-Fi, hotspot, or VPN

## Additional Docs

- `ARCHITECTURE.md`
- `ARCHITECTURE_IMPROVEMENTS.md`
- `IMPLEMENTATION_COMPLETE.md`
- `QUICK_TEST_GUIDE.md`
- `CODE_CHANGES_REFERENCE.md`

## Author

Ganesh Chendke

## License

This project is provided for educational and portfolio use.
