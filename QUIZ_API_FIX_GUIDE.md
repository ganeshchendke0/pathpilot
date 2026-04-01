# 🔧 Career Quiz API Fix & Setup Guide

## ✅ Issues Found & Fixed

### Issue 1: Answer Format Mismatch (FIXED)
**Problem:** The backend `quiz_submit()` function was treating a flat array of tags as a nested array, breaking it into individual characters.

**What Was Wrong:**
```python
# BEFORE (WRONG):
answers = d.get("answers", [])  # receives ["tech","coding","design",...]
all_tags = [tag for ans in answers for tag in ans]  # breaks into ["t","e","c","h","c","o","d","i","n","g",...]
```

**What's Fixed:**
```python
# AFTER (CORRECT):
answers = d.get("answers", [])  # receives ["tech","coding","design",...]
all_tags = [tag for tag in answers if tag]  # properly filters the flat array
```

**File Modified:** `backend/controllers/controllers.py` (lines 218-225)

---

## 🚀 Setup Instructions

### Step 1: Install Python Dependencies
Run from the `backend/` directory:

```bash
cd backend
pip install -r requirements.txt
```

**Requirements:**
- flask==3.0.3
- flask-cors==4.0.1
- psycopg2-binary==2.9.9
- python-dotenv==1.0.1
- PyJWT==2.8.0
- bcrypt==4.1.3
- Werkzeug==3.0.3

### Step 2: Set Up PostgreSQL Database

#### On Windows:
1. **Install PostgreSQL** from https://www.postgresql.org/download/windows/
2. **Create database:**
   ```bash
   psql -U postgres
   CREATE DATABASE pathpilot_db;
   \q
   ```

3. **Initialize schema and seed data:**
   ```bash
   cd backend
   psql -U postgres -d pathpilot_db -f database/schema.sql
   psql -U postgres -d pathpilot_db -f database/seed.sql
   ```

#### On Ubuntu/Linux:
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo sudo -u postgres psql -c "CREATE DATABASE pathpilot_db;"

# Initialize database
sudo -u postgres psql -d pathpilot_db -f backend/database/schema.sql
sudo -u postgres psql -d pathpilot_db -f backend/database/seed.sql
```

### Step 3: Verify Environment Configuration

Check that `backend/.env` has the correct database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pathpilot_db
DB_USER=postgres
DB_PASSWORD=123456  # Change to your PostgreSQL password
SECRET_KEY=pathpilot2024supersecretkey@ganesh
JWT_EXPIRY_HOURS=24
DEBUG=True
PORT=5000
```

> ⚠️ Make sure DB_PORT=5432 (not 5433)

### Step 4: Start the Backend Server

```bash
cd backend
python app.py
```

You should see:
```
 * Serving Flask app 'app'
 * Running on http://127.0.0.1:5000
```

---

## 🧪 Testing the Quiz API

### Test 1: Fetch Quiz Questions

```bash
curl http://127.0.0.1:5000/api/ai/quiz-questions
```

**Expected Response:**
```json
{
  "questions": [
    {
      "id": "...",
      "question": "When you have free time, what do you naturally gravitate towards?",
      "options": [
        {"text": "Building or coding something — apps, scripts, tools", "tags": ["tech","coding","building"]},
        {"text": "Designing or creating visual content", "tags": ["design","creativity","visual","art"]},
        ...
      ],
      "category": "interests"
    },
    ...  // 6 questions total
  ]
}
```

### Test 2: Register & Login (to get token)

```bash
# Register
curl -X POST http://127.0.0.1:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {"id": "...", "name": "Test User", "email": "test@example.com"}
}
```

Save the token for the next test.

### Test 3: Submit Quiz Answers

```bash
curl -X POST http://127.0.0.1:5000/api/ai/quiz-submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"answers":["tech","coding","building","design","creativity","business"]}'
```

**Expected Response:**
```json
{
  "matches": [
    {
      "career_path_id": "1",
      "title": "Full Stack Developer",
      "field": "Technology",
      "score": 90
    },
    {
      "career_path_id": "2",
      "title": "Data Scientist",
      "field": "Technology",
      "score": 75
    },
    ...
  ]
}
```

---

## 🧠 How It Works

### Frontend Flow (career.js)
```javascript
1. startQuiz()
   ↓ Fetches /ai/quiz-questions
   ↓
2. renderQuestion()
   ↓ Shows 4 answer options
   ↓
3. goToNextQuestion()
   ↓ Collects tags from selected option
   ↓ quizAnswers = [["tech","coding","building"], ["design","creativity","visual"], ...]
   ↓
4. goToPreviousQuestion()
   ↓ Navigate back if needed
   ↓
5. submitQuiz()
   ↓ Flattens: ["tech","coding","building","design","creativity","visual",...]
   ↓ Sends to /ai/quiz-submit
   ↓
6. renderQuizResults()
   ↓ Shows matched careers with scores
```

### Backend Flow (controllers.py)
```python
1. quiz_questions()
   ↓ SELECT id, question, options, category FROM quiz_questions
   ↓ Returns all 6 questions with options

2. quiz_submit()
   ↓ Receives answers = ["tech","coding","building",...] (flat array)
   ↓ Filters: all_tags = [tag for tag in answers if tag]
   ↓ Calls: score_career_matches(all_tags)
   ↓ Stores result in quiz_results table
   ↓ Returns matches with scores
```

---

## 🐛 Troubleshooting

### Error: "ModuleNotFoundError: No module named 'dotenv'"
**Solution:** Install dependencies
```bash
pip install python-dotenv flask bcrypt pyjwt psycopg2-binary flask-cors
```

### Error: "could not translate host name to address"
**Solution:** PostgreSQL is not running or DB_HOST is wrong
```bash
# Windows: Start PostgreSQL service
# Or use pgAdmin to verify connection

# Check .env file:
DB_HOST=localhost
DB_PORT=5432
```

### Error: "relation 'quiz_questions' does not exist"
**Solution:** Database hasn't been initialized
```bash
psql -U postgres -d pathpilot_db -f database/schema.sql
psql -U postgres -d pathpilot_db -f database/seed.sql
```

### Quiz returns empty in browser
1. Check browser console for error messages
2. Verify backend is running on http://127.0.0.1:5000
3. Check that user is logged in (token in localStorage)
4. Verify database has quiz_questions data

---

## 📊 Database Schema Reference

### quiz_questions table
```sql
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL,  -- [{text, tags[]}]
    category VARCHAR(60),
    order_num INTEGER,
    created_at TIMESTAMP
);
```

### quiz_results table
```sql
CREATE TABLE quiz_results (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    answers JSONB,
    matched_tags TEXT[],
    top_paths JSONB,  -- [{career_path_id, score}]
    taken_at TIMESTAMP
);
```

### career_paths table
```sql
CREATE TABLE career_paths (
    id UUID PRIMARY KEY,
    title VARCHAR(150),
    field VARCHAR(100),
    description TEXT,
    quiz_tags TEXT[],  -- for career matching
    ...
);
```

---

## ✨ Next Steps

1. **Complete the career matching algorithm**
   - `score_career_matches()` in `backend/utils/ai_engine.py` currently returns mock data
   - Should implement proper scoring based on quiz tags vs career_paths.quiz_tags

2. **Add database queries for career details**
   - Currently returns hardcoded career_path_id values
   - Should fetch actual career data from database

3. **Frontend enhancements**
   - Show career details modal when user clicks on a career match
   - Link to full career profile and learning roadmap

---

## 📝 Summary of Changes

| File | Change | Line |
|------|--------|------|
| `backend/controllers/controllers.py` | Fixed answer flattening logic in `quiz_submit()` | 218-225 |
| `backend/.env` | Verify DB_PORT=5432 | 2 |
| Database | Initialize schema and seed data | - |

