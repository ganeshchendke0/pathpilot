"""
PathPilot AI Engine
- Career quiz tag-matching algorithm
- Skill gap analysis
- Weekly report generation
"""
from collections import Counter
from config.db import query

def score_career_matches(answered_tags: list) -> list:
    """
    Given a list of tags from quiz answers, score every career path
    and return sorted matches with percentage fit.
    """
    tag_count = Counter(answered_tags)
    careers   = query("SELECT id, title, field, icon_emoji, quiz_tags FROM career_paths")
    scores    = []

    for c in careers:
        c_tags = c.get("quiz_tags") or []
        if not c_tags:
            continue
        overlap = sum(tag_count[t] for t in c_tags if t in tag_count)
        max_possible = len(c_tags)
        pct = round((overlap / max_possible) * 100) if max_possible else 0
        scores.append({
            "career_path_id": str(c["id"]),
            "title":  c["title"],
            "field":  c["field"],
            "icon":   c["icon_emoji"],
            "score":  pct,
        })

    scores.sort(key=lambda x: x["score"], reverse=True)
    return scores[:5]


def skill_gap_analysis(user_skills: list, career_id: str) -> dict:
    """
    Compare user's declared skills vs career's required skills.
    """
    career = query("SELECT * FROM career_paths WHERE id=%s", (career_id,), fetch="one")
    if not career:
        return {}

    required   = [s.lower() for s in (career.get("required_skills") or [])]
    user_lower = [s.lower() for s in (user_skills or [])]

    have    = [s for s in required if s in user_lower]
    missing = [s for s in required if s not in user_lower]
    pct     = round((len(have) / len(required)) * 100) if required else 0

    nice_to_have = career.get("nice_to_have_skills") or []

    return {
        "career_title":   career["title"],
        "required_total": len(required),
        "have":           have,
        "missing":        missing,
        "completion_pct": pct,
        "nice_to_have":   nice_to_have,
        "readiness": (
            "🟢 Ready to apply!" if pct >= 80
            else "🟡 Almost there — close the gaps!" if pct >= 50
            else "🔴 Strong foundation needed first."
        )
    }


def generate_weekly_report(uid: str) -> dict:
    """
    Summarise the past 7 days for a user.
    """
    focus = query(
        "SELECT COALESCE(SUM(duration_min),0) mins, COUNT(*) sessions FROM focus_sessions WHERE user_id=%s AND session_date >= CURRENT_DATE-6",
        (uid,), fetch="one")

    goals_done = query(
        "SELECT COUNT(*) cnt FROM goals WHERE user_id=%s AND status='completed' AND updated_at >= NOW()-INTERVAL '7 days'",
        (uid,), fetch="one")

    mood_avg = query(
        "SELECT ROUND(AVG(mood_score),1) avg FROM mood_entries WHERE user_id=%s AND entry_date >= CURRENT_DATE-6",
        (uid,), fetch="one")

    streak = query("SELECT streak_days FROM users WHERE id=%s", (uid,), fetch="one")

    mins       = int(focus["mins"] or 0)
    sessions   = int(focus["sessions"] or 0)
    goals      = int((goals_done or {}).get("cnt", 0))
    mood       = float((mood_avg or {}).get("avg") or 0)
    streak_val = int((streak or {}).get("streak_days", 0))

    lines = []
    if mins >= 300:
        lines.append(f"🔥 Excellent week — you studied for {mins} minutes!")
    elif mins >= 100:
        lines.append(f"📖 Solid effort — {mins} minutes of focused study this week.")
    else:
        lines.append(f"💡 Tip: Try to hit 100 minutes of focused study next week.")

    if goals > 0:
        lines.append(f"✅ You completed {goals} goal{'s' if goals > 1 else ''} this week — great momentum!")

    if mood >= 4:
        lines.append("😊 Your mood was great this week. Keep up those healthy habits!")
    elif mood > 0 and mood < 3:
        lines.append("🧘 Your mood trended low this week. Remember: rest is productive.")

    if streak_val >= 7:
        lines.append(f"⚡ {streak_val}-day streak! You're on fire. Don't break the chain.")

    return {
        "focus_minutes":  mins,
        "focus_sessions": sessions,
        "goals_completed": goals,
        "avg_mood":       mood,
        "streak_days":    streak_val,
        "summary": " ".join(lines) or "Log your study sessions and mood to get personalized insights!",
    }


def generate_roadmap_milestones(career_id: str, weeks: int = 12) -> list:
    """
    Auto-generate a week-by-week learning roadmap for a career path.
    """
    career = query("SELECT * FROM career_paths WHERE id=%s", (career_id,), fetch="one")
    if not career:
        return []

    skills  = career.get("required_skills") or []
    courses = career.get("recommended_courses") or []
    milestones = []

    phase1_end = max(1, weeks // 3)
    for i, skill in enumerate(skills[:phase1_end]):
        milestones.append({
            "week_number": i + 1,
            "title": f"Learn: {skill}",
            "description": f"Build a solid foundation in {skill}. Focus on understanding core concepts before moving on.",
            "resources": [courses[i % len(courses)]] if courses else [],
        })

    phase2_end = max(phase1_end + 1, (weeks * 2) // 3)
    mid_skills = skills[phase1_end:phase2_end]
    for i, skill in enumerate(mid_skills):
        milestones.append({
            "week_number": phase1_end + i + 1,
            "title": f"Build with: {skill}",
            "description": f"Apply {skill} by building a small project. Hands-on practice cements learning.",
            "resources": [courses[(phase1_end + i) % len(courses)]] if courses else [],
        })

    milestones.append({
        "week_number": phase2_end + 1,
        "title": "Build Your Portfolio Project",
        "description": f"Combine your skills to build a full {career['title']} portfolio project.",
        "resources": courses[-1:] if courses else [],
    })
    milestones.append({
        "week_number": weeks,
        "title": "Apply & Interview Prep",
        "description": f"Polish your resume, prep for {career['title']} interviews, and start applying to roles at: {', '.join((career.get('top_companies') or [])[:3])}.",
        "resources": [],
    })

    return milestones[:weeks]