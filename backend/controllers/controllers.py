import jwt
import bcrypt
from utils.ai_engine import ask_career_question, generate_resume
from datetime import datetime, timedelta
from flask import request, jsonify
from config import Config
from models.models import (
    UserModel, GoalModel, CareerModel, FocusModel,
    MoodModel, NotificationModel, RoadmapModel,
    LeaderboardModel, BadgeModel
)
from utils.ai_engine import (
    score_career_matches, skill_gap_analysis,
    generate_weekly_report, generate_roadmap_milestones
)

def _token(uid, role):
    return jwt.encode(
        {"user_id": uid, "role": role, "exp": datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRY)},
        Config.SECRET_KEY, algorithm="HS256")

# ═══════════════════════════════════════════
#  AUTH
# ═══════════════════════════════════════════
def register():
    d = request.get_json()
    name, email, pw = d.get("name","").strip(), d.get("email","").strip().lower(), d.get("password","")
    if not name or not email or not pw:
        return jsonify({"error": "All fields required"}), 400
    if len(pw) < 6:
        return jsonify({"error": "Password min 6 chars"}), 400
    if UserModel.find_by_email(email):
        return jsonify({"error": "Email already registered"}), 409
    hashed = bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
    user   = UserModel.create(name, email, hashed)
    NotificationModel.create(str(user["id"]), "Welcome to PathPilot! 🧭",
                              "Set your first goal and explore career paths to get started.", "success")
    token  = _token(str(user["id"]), "student")
    return jsonify({"token": token, "user": user}), 201

def login():
    d  = request.get_json()
    email, pw = d.get("email","").lower(), d.get("password","")
    user = UserModel.find_by_email(email)
    if not user or not bcrypt.checkpw(pw.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid email or password"}), 401
    UserModel.update_streak(str(user["id"]))
    token = _token(str(user["id"]), user.get("role","student"))
    safe  = {k:v for k,v in user.items() if k != "password_hash"}
    return jsonify({"token": token, "user": safe}), 200

def get_profile():
    user = UserModel.find_by_id(request.user_id)
    if not user: return jsonify({"error": "Not found"}), 404
    badges = BadgeModel.get_user_badges(request.user_id)
    rank   = LeaderboardModel.my_rank(request.user_id)
    return jsonify({"user": user, "badges": badges, "rank": rank}), 200

def update_profile():
    data = request.get_json()
    user = UserModel.update_profile(request.user_id, data)
    return jsonify({"user": user}), 200

# ═══════════════════════════════════════════
#  GOALS
# ═══════════════════════════════════════════
def get_goals():
    return jsonify({"goals": GoalModel.get_all(request.user_id)}), 200

def create_goal():
    d = request.get_json()
    if not d.get("title","").strip():
        return jsonify({"error": "Title required"}), 400
    goal = GoalModel.create(request.user_id, d)
    all_goals = GoalModel.get_all(request.user_id)
    if len(all_goals) == 1:
        BadgeModel.award(request.user_id, "first_goal")
    return jsonify({"goal": goal}), 201

def update_goal(gid):
    d    = request.get_json()
    goal = GoalModel.update(gid, request.user_id, d)
    if not goal: return jsonify({"error": "Goal not found"}), 404
    if d.get("status") == "completed":
        completed = GoalModel.summary(request.user_id)
        if int(completed.get("completed",0)) >= 5:
            BadgeModel.award(request.user_id, "goal_crusher_5")
        UserModel.add_xp(request.user_id, 100)
    return jsonify({"goal": goal}), 200

def delete_goal(gid):
    r = GoalModel.delete(gid, request.user_id)
    if not r: return jsonify({"error": "Not found"}), 404
    return jsonify({"message": "Deleted"}), 200

def goal_summary():
    return jsonify({"summary": GoalModel.summary(request.user_id)}), 200

# ═══════════════════════════════════════════
#  CAREER
# ═══════════════════════════════════════════
def get_careers():
    search = request.args.get("search","")
    field  = request.args.get("field","")
    paths  = CareerModel.search(search) if search else CareerModel.get_all(field or None)
    return jsonify({"career_paths": paths}), 200

def get_career(pid):
    p = CareerModel.get_by_id(pid)
    if not p: return jsonify({"error": "Not found"}), 404
    return jsonify({"career_path": p}), 200

def save_career(pid):
    CareerModel.save(request.user_id, pid)
    saved = CareerModel.get_saved(request.user_id)
    if len(saved) >= 3:
        BadgeModel.award(request.user_id, "career_explorer")
    return jsonify({"message": "Saved"}), 200

def unsave_career(pid):
    r = CareerModel.unsave(request.user_id, pid)
    if not r: return jsonify({"error": "Not saved"}), 404
    return jsonify({"message": "Removed"}), 200

def get_saved_careers():
    return jsonify({"saved_paths": CareerModel.get_saved(request.user_id)}), 200

def skill_gap(pid):
    user   = UserModel.find_by_id(request.user_id)
    skills = user.get("skills") or []
    result = skill_gap_analysis(skills, pid)
    return jsonify(result), 200

# ═══════════════════════════════════════════
#  FOCUS SESSIONS
# ═══════════════════════════════════════════
def log_focus():
    d = request.get_json()
    if not d.get("duration_min"):
        return jsonify({"error": "Duration required"}), 400
    session = FocusModel.log(request.user_id, d)
    UserModel.add_xp(request.user_id, d["duration_min"] // 5)
    UserModel.update_streak(request.user_id)
    total = FocusModel.total_minutes(request.user_id)
    if total >= 6000:
        BadgeModel.award(request.user_id, "study_100h")
    history = FocusModel.history(request.user_id)
    if len(history) == 1:
        BadgeModel.award(request.user_id, "first_focus")
    return jsonify({"session": session}), 201

def get_focus_history():
    return jsonify({"sessions": FocusModel.history(request.user_id)}), 200

def focus_stats():
    weekly = FocusModel.weekly_stats(request.user_id)
    total  = FocusModel.total_minutes(request.user_id)
    streak = UserModel.find_by_id(request.user_id)
    return jsonify({
        "weekly": weekly,
        "total_minutes": total,
        "total_hours": round(total / 60, 1),
        "streak_days": (streak or {}).get("streak_days", 0)
    }), 200

# ═══════════════════════════════════════════
#  WELLNESS
# ═══════════════════════════════════════════
def log_mood():
    d = request.get_json()
    if not d.get("mood_score"):
        return jsonify({"error": "mood_score required"}), 400
    entry = MoodModel.log(request.user_id, d)
    history = MoodModel.history(request.user_id, 7)
    if len(history) >= 7:
        BadgeModel.award(request.user_id, "mood_tracker_7")
    return jsonify({"entry": entry}), 200

def mood_history():
    days = int(request.args.get("days", 14))
    return jsonify({"history": MoodModel.history(request.user_id, days)}), 200

def wellness_insights():
    return jsonify(MoodModel.burnout_score(request.user_id)), 200

# ═══════════════════════════════════════════
#  LEADERBOARD
# ═══════════════════════════════════════════
def weekly_board():
    return jsonify({"leaderboard": LeaderboardModel.weekly()}), 200

def alltime_board():
    return jsonify({"leaderboard": LeaderboardModel.all_time()}), 200

def my_rank():
    rank = LeaderboardModel.my_rank(request.user_id)
    return jsonify({"rank": rank}), 200

# ═══════════════════════════════════════════
#  NOTIFICATIONS
# ═══════════════════════════════════════════
def get_notifications():
    notifs = NotificationModel.get_unread(request.user_id)
    return jsonify({"notifications": notifs}), 200

def mark_read():
    NotificationModel.mark_read(request.user_id)
    return jsonify({"message": "Marked read"}), 200

# ═══════════════════════════════════════════
#  AI ENDPOINTS
# ═══════════════════════════════════════════
def quiz_questions():
    from config.db import query
    qs = query("SELECT id, question, options, category FROM quiz_questions ORDER BY order_num")
    return jsonify({"questions": qs}), 200

def quiz_submit():
    d       = request.get_json()
    answers = d.get("answers", [])
    # answers is already a flat array of tags from frontend
    all_tags = [tag for tag in answers if tag]  # filter out empty/None values
    matches = score_career_matches(all_tags)
    from config.db import execute
    execute(
        "INSERT INTO quiz_results(user_id,answers,matched_tags,top_paths) VALUES(%s,%s,%s,%s)",
        (request.user_id, str(answers), all_tags, str(matches)))
    BadgeModel.award(request.user_id, "quiz_taker")
    return jsonify({"matches": matches}), 200

def weekly_report():
    report = generate_weekly_report(request.user_id)
    return jsonify({"report": report}), 200

# ═══════════════════════════════════════════
#  ROADMAP
# ═══════════════════════════════════════════
def get_roadmaps():
    maps = RoadmapModel.get_user_roadmaps(request.user_id)
    result = []
    for m in maps:
        milestones = RoadmapModel.get_milestones(str(m["id"]))
        done = sum(1 for ms in milestones if ms["is_done"])
        result.append({**m, "milestones": milestones,
                        "progress_pct": round((done / len(milestones)) * 100) if milestones else 0})
    return jsonify({"roadmaps": result}), 200

def create_roadmap():
    d          = request.get_json()
    career_id  = d.get("career_path_id")
    weeks      = int(d.get("total_weeks", 12))
    title      = d.get("title", "My Learning Roadmap")
    roadmap    = RoadmapModel.create(request.user_id, career_id, title, weeks)
    if not roadmap: return jsonify({"error": "Failed to create"}), 400
    milestones = generate_roadmap_milestones(career_id, weeks)
    for ms in milestones:
        RoadmapModel.add_milestone(str(roadmap["id"]), ms["week_number"],
                                    ms["title"], ms["description"], ms.get("resources",[]))
    BadgeModel.award(request.user_id, "roadmap_builder")
    return jsonify({"roadmap": roadmap, "milestones_created": len(milestones)}), 201

def toggle_milestone(mid):
    r = RoadmapModel.toggle_milestone(mid, request.user_id)
    if r and r.get("is_done"):
        UserModel.add_xp(request.user_id, 50)
    return jsonify({"milestone": r}), 200
# ── AI Chat ──────────────────────────────────
def ai_chat():
    data = request.get_json()
    question = data.get("question", "")
    context  = data.get("context", "")
    if not question:
        return jsonify({"error": "Question is required"}), 400
    try:
        answer = ask_career_question(question, context)
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Resume Builder ────────────────────────────
def build_resume():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    try:
        resume = generate_resume(data)
        return jsonify({"resume": resume})
    except Exception as e:
        return jsonify({"error": str(e)}), 500