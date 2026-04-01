import os
import json
from config.db import query

# ❌ REMOVE Gemini (causing all errors)
# import google.generativeai as genai

# ❌ REMOVE these lines
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# model = genai.GenerativeModel("gemini-pro")


# ✅ SAFE AI FUNCTION (NO API NEEDED)
def safe_generate(prompt):
    print("AI fallback used")

    prompt_lower = prompt.lower()

    # ✅ Resume Generator
    if "resume" in prompt_lower:
        return """Name: Student
Email: student@email.com

Summary:
Motivated and enthusiastic student with a strong interest in software development.

Education:
Bachelor's Degree in Computer Science

Skills:
Python, HTML, CSS, JavaScript

Projects:
Career Guidance Web App

Career Objective:
To become a skilled Full Stack Developer and contribute to innovative projects.
"""

    # ✅ Career Chat
    elif "career" in prompt_lower:
        return "To become a Full Stack Developer, start with HTML, CSS, and JavaScript. Then learn backend technologies like Python or Node.js, build real projects, and practice consistently."

    # ✅ Weekly Report
    elif "weekly" in prompt_lower or "report" in prompt_lower:
        return "Great progress this week! You stayed consistent with your goals and learning. Keep improving your skills daily, take breaks when needed, and stay focused. You're on the right path!"

    # ✅ Roadmap
    elif "roadmap" in prompt_lower:
        return json.dumps([
            {"week_number": 1, "title": "Week 1: Basics", "description": "Learn fundamentals", "resources": ["YouTube", "Docs"]},
            {"week_number": 2, "title": "Week 2: Practice", "description": "Build small projects", "resources": ["GitHub"]},
            {"week_number": 3, "title": "Week 3: Advanced", "description": "Learn advanced topics", "resources": ["Courses"]}
        ])

    # Default
    return "AI is currently unavailable. Please try again later."


# ✅ 1. Career Chat
def ask_career_question(question, context=""):
    prompt = f"""
You are PathPilot AI — a friendly career advisor.
Question: {question}
"""
    return safe_generate(prompt)


# ✅ 2. Resume Generator
def generate_resume(data):
    prompt = f"""
Generate resume:
Name: {data.get('name')}
Skills: {data.get('skills')}
"""
    return safe_generate(prompt)


# ✅ 3. Career Match Scoring (STATIC — NO AI)
def score_career_matches(tags):
    return [
        {"career_path_id": "1", "title": "Full Stack Developer", "field": "Technology", "score": 90},
        {"career_path_id": "2", "title": "Data Scientist", "field": "Technology", "score": 75},
        {"career_path_id": "3", "title": "UI/UX Designer", "field": "Design", "score": 60}
    ]


# ✅ 4. Skill Gap Analysis (Already perfect)
def skill_gap_analysis(user_skills, career_id):
    try:
        rows = query("SELECT required_skills FROM career_paths WHERE id=%s", (career_id,))
        if not rows:
            return {"error": "Career not found"}

        required = rows[0]["required_skills"] or []

        user_lower = [s.lower() for s in user_skills]
        have = [s for s in required if s.lower() in user_lower]
        missing = [s for s in required if s.lower() not in user_lower]

        pct = round((len(have) / len(required)) * 100) if required else 0

        if pct >= 80:
            readiness = "You are well prepared for this career!"
        elif pct >= 50:
            readiness = "You are on the right track, keep learning!"
        else:
            readiness = "You have a lot to learn, but you can do it!"

        return {
            "have": have,
            "missing": missing,
            "completion_pct": pct,
            "readiness": readiness
        }

    except Exception as e:
        return {"error": str(e)}


# ✅ 5. Weekly Report
def generate_weekly_report(user_id):
    prompt = "Generate weekly report"
    return safe_generate(prompt)


# ✅ 6. Roadmap Generator
def generate_roadmap_milestones(career_id, weeks):
    try:
        response = safe_generate("roadmap")

        try:
            return json.loads(response)
        except:
            return []

    except Exception:
        return []