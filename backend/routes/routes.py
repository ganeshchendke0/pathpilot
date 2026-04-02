from flask import Blueprint
from middleware.auth_middleware import token_required
from controllers.controllers import (
    # Auth
    register, login, get_profile, update_profile,
    # Goals
    get_goals, create_goal, update_goal, delete_goal, goal_summary,
    # Career
    get_careers, get_career, save_career, unsave_career, get_saved_careers, skill_gap,
    # Focus
    log_focus, get_focus_history, focus_stats,
    # Wellness
    log_mood, mood_history, wellness_insights,
    # Leaderboard
    weekly_board, alltime_board, my_rank,
    # Notifications
    get_notifications, mark_read,
    # AI
    quiz_questions, quiz_submit, weekly_report,
    ai_chat, build_resume, download_resume,

    # Roadmap
    get_roadmaps, create_roadmap, toggle_milestone,
)

# ── Auth ──────────────────────────────────────────────────────
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
auth_bp.route("/register", methods=["POST"])(register)
auth_bp.route("/login",    methods=["POST"])(login)
auth_bp.route("/profile",  methods=["GET"])(token_required(get_profile))
auth_bp.route("/profile",  methods=["PUT"])(token_required(update_profile))

# ── Goals ─────────────────────────────────────────────────────
goals_bp = Blueprint("goals", __name__, url_prefix="/api/goals")
goals_bp.route("/",            methods=["GET"])(token_required(get_goals))
goals_bp.route("/",            methods=["POST"])(token_required(create_goal))
goals_bp.route("/summary",     methods=["GET"])(token_required(goal_summary))
goals_bp.route("/<gid>",       methods=["PUT"])(token_required(update_goal))
goals_bp.route("/<gid>",       methods=["DELETE"])(token_required(delete_goal))

# ── Career ────────────────────────────────────────────────────
career_bp = Blueprint("career", __name__, url_prefix="/api/career")
career_bp.route("/paths",              methods=["GET"])(get_careers)
career_bp.route("/paths/<pid>",        methods=["GET"])(get_career)
career_bp.route("/paths/<pid>/save",   methods=["POST"])(token_required(save_career))
career_bp.route("/paths/<pid>/unsave", methods=["DELETE"])(token_required(unsave_career))
career_bp.route("/saved",              methods=["GET"])(token_required(get_saved_careers))
career_bp.route("/skill-gap/<pid>",    methods=["GET"])(token_required(skill_gap))

# ── Focus ─────────────────────────────────────────────────────
focus_bp = Blueprint("focus", __name__, url_prefix="/api/focus")
focus_bp.route("/sessions",  methods=["POST"])(token_required(log_focus))
focus_bp.route("/sessions",  methods=["GET"])(token_required(get_focus_history))
focus_bp.route("/stats",     methods=["GET"])(token_required(focus_stats))

# ── Wellness ──────────────────────────────────────────────────
wellness_bp = Blueprint("wellness", __name__, url_prefix="/api/wellness")
wellness_bp.route("/mood",     methods=["POST"])(token_required(log_mood))
wellness_bp.route("/history",  methods=["GET"])(token_required(mood_history))
wellness_bp.route("/insights", methods=["GET"])(token_required(wellness_insights))

# ── Leaderboard ───────────────────────────────────────────────
lb_bp = Blueprint("leaderboard", __name__, url_prefix="/api/leaderboard")
lb_bp.route("/weekly",   methods=["GET"])(weekly_board)
lb_bp.route("/all-time", methods=["GET"])(alltime_board)
lb_bp.route("/my-rank",  methods=["GET"])(token_required(my_rank))

# ── Notifications ─────────────────────────────────────────────
notif_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")
notif_bp.route("/",          methods=["GET"])(token_required(get_notifications))
notif_bp.route("/mark-read", methods=["POST"])(token_required(mark_read))

# ── AI ────────────────────────────────────────────────────────
ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")
ai_bp.route("/quiz-questions", methods=["GET"])(quiz_questions)
ai_bp.route("/quiz-submit",    methods=["POST"])(token_required(quiz_submit))
ai_bp.route("/weekly-report",  methods=["GET"])(token_required(weekly_report))
ai_bp.route("/chat",   methods=["POST"])(token_required(ai_chat))
ai_bp.route("/resume", methods=["POST"])(token_required(build_resume))
ai_bp.route("/resume/download", methods=["POST"])(token_required(download_resume))

# ── Roadmap ───────────────────────────────────────────────────
roadmap_bp = Blueprint("roadmap", __name__, url_prefix="/api/roadmap")
roadmap_bp.route("/",               methods=["GET"])(token_required(get_roadmaps))
roadmap_bp.route("/",               methods=["POST"])(token_required(create_roadmap))
roadmap_bp.route("/<mid>/toggle",   methods=["PATCH"])(token_required(toggle_milestone))