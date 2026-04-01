# 🧭 PathPilot — Smart Student Companion

PathPilot is a full-stack web application designed to help students manage their academic life, career planning, productivity, and mental wellness — all in one place.

---

## 🚀 Features

- 🎯 Goal Tracking System (create, update, track progress)
- 🍅 Pomodoro Focus Timer (boost productivity)
- 🧭 AI Career Quiz (career suggestions based on interests)
- 🗺️ Roadmap Builder (step-by-step career guidance)
- 🧘 Wellness Tracker (mood, stress, energy tracking)
- 🏆 Leaderboard & Badges (gamification system)
- 🔔 Notifications System

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla JS)

### Backend
- Python (Flask)
- REST API

### Database
- PostgreSQL

---

## 📁 Project Structure

pathpilot/
│
├── backend/
│   ├── app.py
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── models/
│
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── career.html
│   ├── focus.html
│   ├── wellness.html
│   ├── roadmap.html
│   ├── leaderboard.html
│   ├── css/
│   └── js/
│
├── README.md
└── requirements.txt

---

## ⚙️ Setup Instructions (Linux / Ubuntu)

### 🔹 Step 1: Clone Repository
git clone https://github.com/your-username/pathpilot.git  
cd pathpilot  

---

### 🔹 Step 2: Backend Setup
cd backend  
python3 -m venv venv  
source venv/bin/activate  
pip install flask bcrypt pyjwt python-dotenv  
python3 app.py  

Backend runs on:  
http://127.0.0.1:5000  

---

### 🔹 Step 3: Frontend Setup
cd ../frontend  
python3 -m http.server 5500  

Open in browser:  
http://127.0.0.1:5500/index.html  

---

## 🔗 API Configuration

Make sure in frontend/js/api.js:

const BASE_URL = "http://127.0.0.1:5000/api";

---

## 🐞 Common Errors & Fixes

### ❌ API is not defined
✔ Fix:
- Check script order in HTML:
<script src="js/api.js"></script>
<script src="js/auth.js"></script>

---

### ❌ Failed to fetch / connection refused
✔ Fix:
- Backend not running
- Wrong BASE_URL

---

### ❌ Module not found
✔ Fix:
pip install flask bcrypt pyjwt

---

### ❌ 404 Error in frontend
✔ Fix:
cd frontend  
python3 -m http.server 5500  

---

## 📊 System Modules

- Authentication (Login/Register)
- Goal Management
- Career Explorer
- Focus Session Tracker
- Wellness Monitoring
- Leaderboard System
- AI Quiz Engine
- Roadmap Generator

---

## 📌 Future Improvements

- Deploy to cloud (AWS / Render / Vercel)
- Add AI recommendations
- Improve mobile UI
- Add Google login

---

## 👨‍💻 Author

Ganesh Chendke

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

---

## 📜 License

This project is for educational purposes.