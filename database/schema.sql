-- ═══════════════════════════════════════════════════════════
--  PathPilot v2 — Full Database Schema
--  Run: psql -U postgres -d pathpilot_db -f schema.sql
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for fuzzy search

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            VARCHAR(20)  DEFAULT 'student',
    avatar_url      TEXT,
    bio             TEXT,
    college         VARCHAR(200),
    year_of_study   INTEGER CHECK (year_of_study BETWEEN 1 AND 6),
    branch          VARCHAR(150),
    skills          TEXT[],             -- self-declared skills
    linkedin_url    TEXT,
    github_url      TEXT,
    resume_url      TEXT,
    xp_points       INTEGER DEFAULT 0,  -- gamification
    streak_days     INTEGER DEFAULT 0,
    last_active     DATE DEFAULT CURRENT_DATE,
    is_public       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- GOALS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    category    VARCHAR(50)  DEFAULT 'personal',
    priority    VARCHAR(20)  DEFAULT 'medium',
    status      VARCHAR(30)  DEFAULT 'not_started',
    deadline    DATE,
    progress    INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    tags        TEXT[],
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CAREER PATHS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_paths (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               VARCHAR(150) NOT NULL,
    field               VARCHAR(100),
    description         TEXT,
    avg_salary_inr      VARCHAR(60),
    avg_salary_usd      VARCHAR(60),
    growth_rate         VARCHAR(40),
    difficulty          VARCHAR(20) DEFAULT 'moderate',  -- easy|moderate|hard
    time_to_entry       VARCHAR(60),
    required_skills     TEXT[],
    nice_to_have_skills TEXT[],
    recommended_courses TEXT[],
    top_companies       TEXT[],
    job_roles           TEXT[],
    icon_emoji          VARCHAR(10),
    quiz_tags           TEXT[],     -- used for career quiz matching
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SAVED CAREER PATHS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_career_paths (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    career_path_id  UUID REFERENCES career_paths(id) ON DELETE CASCADE,
    saved_at        TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, career_path_id)
);

-- ─────────────────────────────────────────
-- LEARNING ROADMAPS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roadmaps (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    career_path_id  UUID REFERENCES career_paths(id),
    title           VARCHAR(200),
    total_weeks     INTEGER DEFAULT 12,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roadmap_milestones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id  UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    title       VARCHAR(200),
    description TEXT,
    resources   TEXT[],
    is_done     BOOLEAN DEFAULT FALSE,
    done_at     TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- FOCUS SESSIONS (Pomodoro)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS focus_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    subject         VARCHAR(150),
    goal_id         UUID REFERENCES goals(id) ON DELETE SET NULL,
    duration_min    INTEGER NOT NULL,
    type            VARCHAR(20) DEFAULT 'pomodoro',  -- pomodoro|deep|short
    completed       BOOLEAN DEFAULT TRUE,
    notes           TEXT,
    session_date    DATE DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MOOD / WELLNESS TRACKER
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mood_entries (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    mood_score  INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 5),  -- 1=very low, 5=great
    energy      INTEGER CHECK (energy BETWEEN 1 AND 5),
    stress      INTEGER CHECK (stress BETWEEN 1 AND 5),
    sleep_hours NUMERIC(3,1),
    note        TEXT,
    tags        TEXT[],   -- e.g. ['exam_stress', 'productive', 'tired']
    entry_date  DATE DEFAULT CURRENT_DATE,
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, entry_date)   -- one entry per day
);

-- ─────────────────────────────────────────
-- CAREER QUIZ QUESTIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_questions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question    TEXT NOT NULL,
    options     JSONB NOT NULL,   -- [{text, tags[]}]
    category    VARCHAR(60),
    order_num   INTEGER,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- QUIZ RESULTS (career matching)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_results (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    answers         JSONB,
    matched_tags    TEXT[],
    top_paths       JSONB,   -- [{career_path_id, score}]
    taken_at        TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200),
    message     TEXT NOT NULL,
    type        VARCHAR(30) DEFAULT 'info',
    link        TEXT,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- XP / BADGES (Gamification)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        VARCHAR(60) UNIQUE NOT NULL,
    name        VARCHAR(100),
    description TEXT,
    icon_emoji  VARCHAR(10),
    xp_reward   INTEGER DEFAULT 50
);

CREATE TABLE IF NOT EXISTS user_badges (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id    UUID REFERENCES badges(id),
    earned_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- ─────────────────────────────────────────
-- WEEKLY REPORTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start      DATE NOT NULL,
    focus_minutes   INTEGER DEFAULT 0,
    goals_completed INTEGER DEFAULT 0,
    avg_mood        NUMERIC(3,1),
    xp_earned       INTEGER DEFAULT 0,
    summary_text    TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_goals_user          ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status        ON goals(status);
CREATE INDEX IF NOT EXISTS idx_focus_user_date     ON focus_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_mood_user_date      ON mood_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_notif_user_read     ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_roadmap_user        ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_career_field        ON career_paths(field);
CREATE INDEX IF NOT EXISTS idx_career_title_trgm   ON career_paths USING gin(title gin_trgm_ops);