from config.db import query, execute

# ── USER ──────────────────────────────────────────────────────
class UserModel:
    @staticmethod
    def find_by_email(email):
        return query("SELECT * FROM users WHERE email=%s", (email,), fetch="one")

    @staticmethod
    def find_by_id(uid):
        return query(
            "SELECT id,name,email,role,avatar_url,bio,college,year_of_study,branch,skills,linkedin_url,github_url,xp_points,streak_days,created_at FROM users WHERE id=%s",
            (uid,), fetch="one")

    @staticmethod
    def create(name, email, pwd_hash):
        return execute(
            "INSERT INTO users(name,email,password_hash) VALUES(%s,%s,%s) RETURNING id,name,email,role,xp_points,created_at",
            (name, email, pwd_hash))

    @staticmethod
    def update_profile(uid, data):
        return execute(
            """UPDATE users SET name=%s, bio=%s, college=%s, year_of_study=%s, branch=%s,
               skills=%s, linkedin_url=%s, github_url=%s, updated_at=NOW()
               WHERE id=%s RETURNING id,name,email,bio,college,year_of_study,branch,skills,linkedin_url,github_url""",
            (data['name'], data.get('bio'), data.get('college'), data.get('year_of_study'),
             data.get('branch'), data.get('skills'), data.get('linkedin_url'), data.get('github_url'), uid))

    @staticmethod
    def add_xp(uid, pts):
        return execute("UPDATE users SET xp_points=xp_points+%s WHERE id=%s RETURNING xp_points", (pts, uid))

    @staticmethod
    def update_streak(uid):
        return execute("""
            UPDATE users SET
              streak_days = CASE WHEN last_active = CURRENT_DATE - 1 THEN streak_days+1
                                 WHEN last_active < CURRENT_DATE - 1 THEN 1
                                 ELSE streak_days END,
              last_active = CURRENT_DATE
            WHERE id=%s RETURNING streak_days""", (uid,))

# ── GOAL ──────────────────────────────────────────────────────
class GoalModel:
    @staticmethod
    def get_all(uid):
        return query("SELECT * FROM goals WHERE user_id=%s ORDER BY created_at DESC", (uid,))

    @staticmethod
    def create(uid, d):
        return execute(
            "INSERT INTO goals(user_id,title,description,category,priority,deadline,tags) VALUES(%s,%s,%s,%s,%s,%s,%s) RETURNING *",
            (uid, d['title'], d.get('description'), d.get('category','personal'),
             d.get('priority','medium'), d.get('deadline'), d.get('tags',[])))

    @staticmethod
    def update(gid, uid, d):
        return execute(
            """UPDATE goals SET title=%s,description=%s,category=%s,priority=%s,status=%s,
               progress=%s,deadline=%s,tags=%s,updated_at=NOW() WHERE id=%s AND user_id=%s RETURNING *""",
            (d['title'], d.get('description'), d.get('category'), d.get('priority'),
             d.get('status'), d.get('progress',0), d.get('deadline'), d.get('tags',[]),
             gid, uid))

    @staticmethod
    def delete(gid, uid):
        return execute("DELETE FROM goals WHERE id=%s AND user_id=%s RETURNING id", (gid, uid))

    @staticmethod
    def summary(uid):
        return query(
            """SELECT COUNT(*) total,
               COUNT(*) FILTER(WHERE status='completed') completed,
               COUNT(*) FILTER(WHERE status='in_progress') in_progress,
               COUNT(*) FILTER(WHERE status='not_started') not_started
               FROM goals WHERE user_id=%s""", (uid,), fetch="one")

# ── CAREER PATH ───────────────────────────────────────────────
class CareerModel:
    @staticmethod
    def get_all(field=None):
        if field:
            return query("SELECT * FROM career_paths WHERE field=%s ORDER BY title", (field,))
        return query("SELECT * FROM career_paths ORDER BY title")

    @staticmethod
    def search(q, field=None):
        normalized = q.strip().lower()
        if normalized in {"it", "tech", "technology"}:
            return CareerModel.get_all(field or "Technology")

        pattern = f"%{q}%"
        sql = """
            SELECT *
            FROM career_paths
            WHERE (
                title ILIKE %s
                OR field ILIKE %s
                OR description ILIKE %s
                OR EXISTS (
                    SELECT 1
                    FROM unnest(COALESCE(job_roles, ARRAY[]::TEXT[])) AS role
                    WHERE role ILIKE %s
                )
                OR EXISTS (
                    SELECT 1
                    FROM unnest(COALESCE(required_skills, ARRAY[]::TEXT[])) AS skill
                    WHERE skill ILIKE %s
                )
                OR EXISTS (
                    SELECT 1
                    FROM unnest(COALESCE(nice_to_have_skills, ARRAY[]::TEXT[])) AS bonus_skill
                    WHERE bonus_skill ILIKE %s
                )
                OR EXISTS (
                    SELECT 1
                    FROM unnest(COALESCE(quiz_tags, ARRAY[]::TEXT[])) AS tag
                    WHERE tag ILIKE %s
                )
            )
        """
        params = [pattern, pattern, pattern, pattern, pattern, pattern, pattern]
        if field:
            sql += " AND field=%s"
            params.append(field)
        sql += " ORDER BY title"
        return query(sql, tuple(params))

    @staticmethod
    def get_by_id(pid):
        return query("SELECT * FROM career_paths WHERE id=%s", (pid,), fetch="one")

    @staticmethod
    def save(uid, pid):
        return execute(
            "INSERT INTO saved_career_paths(user_id,career_path_id) VALUES(%s,%s) ON CONFLICT DO NOTHING RETURNING *",
            (uid, pid))

    @staticmethod
    def unsave(uid, pid):
        return execute("DELETE FROM saved_career_paths WHERE user_id=%s AND career_path_id=%s RETURNING id", (uid, pid))

    @staticmethod
    def get_saved(uid):
        return query(
            "SELECT cp.* FROM career_paths cp JOIN saved_career_paths s ON cp.id=s.career_path_id WHERE s.user_id=%s ORDER BY s.saved_at DESC",
            (uid,))

# ── FOCUS SESSION ─────────────────────────────────────────────
class FocusModel:
    @staticmethod
    def log(uid, d):
        return execute(
            "INSERT INTO focus_sessions(user_id,subject,goal_id,duration_min,type,notes) VALUES(%s,%s,%s,%s,%s,%s) RETURNING *",
            (uid, d.get('subject'), d.get('goal_id'), d['duration_min'], d.get('type','pomodoro'), d.get('notes')))

    @staticmethod
    def history(uid, limit=20):
        return query("SELECT * FROM focus_sessions WHERE user_id=%s ORDER BY created_at DESC LIMIT %s", (uid, limit))

    @staticmethod
    def weekly_stats(uid):
        return query(
            """SELECT session_date, SUM(duration_min) total_min, COUNT(*) sessions
               FROM focus_sessions WHERE user_id=%s AND session_date >= CURRENT_DATE-6
               GROUP BY session_date ORDER BY session_date""", (uid,))

    @staticmethod
    def total_minutes(uid):
        r = query("SELECT COALESCE(SUM(duration_min),0) total FROM focus_sessions WHERE user_id=%s", (uid,), fetch="one")
        return r['total'] if r else 0

# ── MOOD ──────────────────────────────────────────────────────
class MoodModel:
    @staticmethod
    def log(uid, d):
        return execute(
            """INSERT INTO mood_entries(user_id,mood_score,energy,stress,sleep_hours,note,tags)
               VALUES(%s,%s,%s,%s,%s,%s,%s)
               ON CONFLICT(user_id,entry_date) DO UPDATE
               SET mood_score=%s,energy=%s,stress=%s,sleep_hours=%s,note=%s,tags=%s RETURNING *""",
            (uid, d['mood_score'], d.get('energy'), d.get('stress'), d.get('sleep_hours'), d.get('note'), d.get('tags',[]),
             d['mood_score'], d.get('energy'), d.get('stress'), d.get('sleep_hours'), d.get('note'), d.get('tags',[])))

    @staticmethod
    def history(uid, days=14):
        return query(
            "SELECT * FROM mood_entries WHERE user_id=%s AND entry_date >= CURRENT_DATE-%s ORDER BY entry_date DESC",
            (uid, days))

    @staticmethod
    def burnout_score(uid):
        rows = query(
            "SELECT mood_score, stress, energy FROM mood_entries WHERE user_id=%s ORDER BY entry_date DESC LIMIT 7",
            (uid,))
        if not rows: return {"score": 0, "level": "unknown", "tip": "Start tracking your mood daily!"}
        avg_mood   = sum(r['mood_score'] for r in rows) / len(rows)
        avg_stress = sum((r['stress'] or 3) for r in rows) / len(rows)
        avg_energy = sum((r['energy'] or 3) for r in rows) / len(rows)
        risk = (avg_stress * 0.5) + ((6 - avg_mood) * 0.3) + ((6 - avg_energy) * 0.2)
        if   risk >= 4.0: level, tip = "high",   "⚠️ High burnout risk. Take a real break today — no screens."
        elif risk >= 2.5: level, tip = "medium",  "😐 Moderate stress. Try a short walk and 7h sleep tonight."
        else:             level, tip = "low",     "✅ You're doing well. Keep up the healthy habits!"
        return {"score": round(risk, 1), "level": level, "tip": tip, "avg_mood": round(avg_mood,1)}

# ── NOTIFICATION ──────────────────────────────────────────────
class NotificationModel:
    @staticmethod
    def create(uid, title, message, ntype="info", link=None):
        return execute(
            "INSERT INTO notifications(user_id,title,message,type,link) VALUES(%s,%s,%s,%s,%s) RETURNING *",
            (uid, title, message, ntype, link))

    @staticmethod
    def get_unread(uid):
        return query(
            "SELECT * FROM notifications WHERE user_id=%s AND is_read=FALSE ORDER BY created_at DESC LIMIT 10",
            (uid,))

    @staticmethod
    def mark_read(uid):
        execute("UPDATE notifications SET is_read=TRUE WHERE user_id=%s", (uid,))

# ── ROADMAP ───────────────────────────────────────────────────
class RoadmapModel:
    @staticmethod
    def get_user_roadmaps(uid):
        return query("SELECT * FROM roadmaps WHERE user_id=%s ORDER BY created_at DESC", (uid,))

    @staticmethod
    def create(uid, career_path_id, title, weeks):
        return execute(
            "INSERT INTO roadmaps(user_id,career_path_id,title,total_weeks) VALUES(%s,%s,%s,%s) RETURNING *",
            (uid, career_path_id, title, weeks))

    @staticmethod
    def get_milestones(roadmap_id):
        return query("SELECT * FROM roadmap_milestones WHERE roadmap_id=%s ORDER BY week_number", (roadmap_id,))

    @staticmethod
    def add_milestone(roadmap_id, week, title, desc, resources):
        return execute(
            "INSERT INTO roadmap_milestones(roadmap_id,week_number,title,description,resources) VALUES(%s,%s,%s,%s,%s) RETURNING *",
            (roadmap_id, week, title, desc, resources))

    @staticmethod
    def toggle_milestone(mid, uid):
        return execute(
            """UPDATE roadmap_milestones SET is_done=NOT is_done,
               done_at=CASE WHEN is_done THEN NULL ELSE NOW() END
               WHERE id=%s RETURNING *""", (mid,))

# ── LEADERBOARD ───────────────────────────────────────────────
class LeaderboardModel:
    @staticmethod
    def weekly():
        return query(
            """SELECT u.id,u.name,u.avatar_url,u.college,
               COALESCE(SUM(f.duration_min),0) focus_minutes,
               COUNT(DISTINCT f.session_date) active_days
               FROM users u
               LEFT JOIN focus_sessions f ON u.id=f.user_id AND f.session_date >= CURRENT_DATE-6
               WHERE u.is_public=TRUE
               GROUP BY u.id,u.name,u.avatar_url,u.college
               ORDER BY focus_minutes DESC LIMIT 20""")

    @staticmethod
    def all_time():
        return query(
            """SELECT u.id,u.name,u.avatar_url,u.college,u.xp_points,u.streak_days
               FROM users u WHERE u.is_public=TRUE
               ORDER BY u.xp_points DESC LIMIT 20""")

    @staticmethod
    def my_rank(uid):
        r = query(
            """SELECT rank FROM (
               SELECT id, RANK() OVER(ORDER BY xp_points DESC) rank FROM users WHERE is_public=TRUE
            ) t WHERE id=%s""", (uid,), fetch="one")
        return r['rank'] if r else None

# ── BADGES ────────────────────────────────────────────────────
class BadgeModel:
    @staticmethod
    def get_user_badges(uid):
        return query(
            "SELECT b.*,ub.earned_at FROM badges b JOIN user_badges ub ON b.id=ub.badge_id WHERE ub.user_id=%s",
            (uid,))

    @staticmethod
    def award(uid, slug):
        badge = query("SELECT * FROM badges WHERE slug=%s", (slug,), fetch="one")
        if not badge: return None
        result = execute(
            "INSERT INTO user_badges(user_id,badge_id) VALUES(%s,%s) ON CONFLICT DO NOTHING RETURNING *",
            (uid, badge['id']))
        if result:
            UserModel.add_xp(uid, badge['xp_reward'])
        return result
