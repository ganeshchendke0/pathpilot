// ═══════════════════════════════════════════
//  PathPilot v2 — API Client
// ═══════════════════════════════════════════

const API = "http://127.0.0.1:5000/api";

function _clearStoredSession() {
  localStorage.removeItem("pp_token");
  localStorage.removeItem("pp_user");
}

function _parseJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function _hasValidStoredSession() {
  const token = localStorage.getItem("pp_token");
  if (!token) return false;

  const payload = _parseJwtPayload(token);
  if (!payload?.exp) {
    _clearStoredSession();
    return false;
  }

  if ((payload.exp * 1000) <= Date.now()) {
    _clearStoredSession();
    return false;
  }

  return true;
}

async function _call(endpoint, options = {}) {
  const token = _hasValidStoredSession() ? localStorage.getItem("pp_token") : null;
  const cfg = {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };
  if (options.body && typeof options.body === "object") {
    cfg.body = JSON.stringify(options.body);
  }
  const res  = await fetch(`${API}${endpoint}`, cfg);
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      _clearStoredSession();
      if (!window.location.pathname.endsWith("index.html")) {
        window.location.href = "index.html";
      }
    }
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

// ── Auth ──────────────────────────────────
const Auth = {
  register: (name, email, pw)    => _call("/auth/register", { method:"POST", body:{name,email,password:pw} }),
  login:    (email, pw)          => _call("/auth/login",    { method:"POST", body:{email,password:pw} }),
  profile:  ()                   => _call("/auth/profile"),
  update:   (data)               => _call("/auth/profile",  { method:"PUT",  body:data }),
  isLoggedIn: ()                 => _hasValidStoredSession(),
  currentUser: ()                => { try { return JSON.parse(localStorage.getItem("pp_user")); } catch { return null; } },
  saveSession(token, user)       { localStorage.setItem("pp_token", token); localStorage.setItem("pp_user", JSON.stringify(user)); },
  logout()                       { _clearStoredSession(); window.location.href = "index.html"; },
};

// ── Goals ─────────────────────────────────
const Goals = {
  getAll:   ()         => _call("/goals/"),
  create:   (d)        => _call("/goals/",     { method:"POST",   body:d }),
  update:   (id, d)    => _call(`/goals/${id}`,{ method:"PUT",    body:d }),
  delete:   (id)       => _call(`/goals/${id}`,{ method:"DELETE" }),
  summary:  ()         => _call("/goals/summary"),
};

// ── Career ────────────────────────────────
const Career = {
  getPaths:   (search="", field="") => _call(`/career/paths?search=${encodeURIComponent(search)}&field=${encodeURIComponent(field)}`),
  getPath:    (id)      => _call(`/career/paths/${id}`),
  save:       (id)      => _call(`/career/paths/${id}/save`,   { method:"POST"   }),
  unsave:     (id)      => _call(`/career/paths/${id}/unsave`, { method:"DELETE" }),
  getSaved:   ()        => _call("/career/saved"),
  skillGap:   (id)      => _call(`/career/skill-gap/${id}`),
};

// ── Focus ─────────────────────────────────
const Focus = {
  log:      (d)  => _call("/focus/sessions", { method:"POST", body:d }),
  history:  ()   => _call("/focus/sessions"),
  stats:    ()   => _call("/focus/stats"),
};

// ── Wellness ──────────────────────────────
const Wellness = {
  log:      (d)    => _call("/wellness/mood",    { method:"POST", body:d }),
  history:  (days) => _call(`/wellness/history?days=${days||14}`),
  insights: ()     => _call("/wellness/insights"),
};

// ── Leaderboard ───────────────────────────
const Leaderboard = {
  weekly:  () => _call("/leaderboard/weekly"),
  allTime: () => _call("/leaderboard/all-time"),
  myRank:  () => _call("/leaderboard/my-rank"),
};

// ── Notifications ─────────────────────────
const Notifications = {
  get:      () => _call("/notifications/"),
  markRead: () => _call("/notifications/mark-read", { method:"POST" }),
};

// ── AI ────────────────────────────────────
const AI = {
  quizQuestions: ()        => _call("/ai/quiz-questions"),
  quizSubmit:    (answers) => _call("/ai/quiz-submit", { method:"POST", body:{ answers } }),
  weeklyReport:  ()        => _call("/ai/weekly-report"),
};

// ── Roadmap ───────────────────────────────
const Roadmap = {
  getAll:    ()    => _call("/roadmap/"),
  create:    (d)   => _call("/roadmap/",              { method:"POST",  body:d }),
  toggle:    (mid) => _call(`/roadmap/${mid}/toggle`, { method:"PATCH" }),
};
