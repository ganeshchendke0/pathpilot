// ═══════════════════════════════════════════
//  PathPilot v2 — Dashboard Logic
// ═══════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;

  const user = Auth.currentUser();
  renderWelcome(user);

  await Promise.allSettled([
    loadSummary(),
    loadGoals(),
    loadWeeklyReport(),
    loadNotifications(),
    loadRecentFocus(),
  ]);

  setupGoalModal();
  document.getElementById("logout-btn")?.addEventListener("click", () => Auth.logout());
});

// ── Welcome ────────────────────────────────
function renderWelcome(user) {
  const nameEl = document.getElementById("welcome-name");
  const xpEl   = document.getElementById("user-xp");
  const strEl  = document.getElementById("user-streak");
  if (nameEl) nameEl.textContent = user?.name?.split(" ")[0] || "Student";
  if (xpEl && user)  xpEl.textContent  = `⚡ ${user.xp_points || 0} XP`;
  if (strEl && user) strEl.textContent = `🔥 ${user.streak_days || 0} day streak`;

  const hour = new Date().getHours();
  const greetEl = document.getElementById("greeting");
  if (greetEl) {
    greetEl.textContent =
      hour < 12 ? "Good morning!" :
      hour < 17 ? "Good afternoon!" :
      "Good evening!";
  }
}

// ── Stats ──────────────────────────────────
async function loadSummary() {
  try {
    const { summary } = await Goals.summary();
    const focusData   = await Focus.stats();

    setText("stat-total",     summary.total || 0);
    setText("stat-completed", summary.completed || 0);
    setText("stat-inprog",    summary.in_progress || 0);
    setText("stat-hours",     focusData.total_hours || 0);

    document.querySelectorAll(".stat-num").forEach(el => {
      const target = parseInt(el.textContent);
      animateCount(el, 0, target, 800);
    });
  } catch {}
}

function animateCount(el, from, to, duration) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(from + (to - from) * progress);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Weekly Report ─────────────────────────
async function loadWeeklyReport() {
  try {
    const { report } = await AI.weeklyReport();
    const el = document.getElementById("weekly-summary");
    if (el) el.textContent = report.summary || "Log study sessions and mood to get your weekly insights!";

    setText("report-focus",  `${Math.floor((report.focus_minutes || 0) / 60)}h ${(report.focus_minutes || 0) % 60}m`);
    setText("report-goals",  report.goals_completed || 0);
    setText("report-mood",   report.avg_mood ? `${report.avg_mood}/5` : "—");
    setText("report-streak", `${report.streak_days || 0} days`);
  } catch {}
}

// ── Goals ─────────────────────────────────
async function loadGoals() {
  const grid = document.getElementById("goals-grid");
  if (!grid) return;
  try {
    const { goals } = await Goals.getAll();
    if (!goals.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-emoji">🎯</div>
          <div class="empty-title">No goals yet</div>
          <p class="empty-sub">Set your first goal to start building momentum</p>
        </div>`;
      return;
    }
    grid.innerHTML = goals.map(g => goalCard(g)).join("");
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p class="empty-sub">⚠️ ${err.message}</p></div>`;
  }
}

function goalCard(g) {
  const catIcons = { academic:"📚", career:"💼", personal:"🌱", skill:"🛠️" };
  return `
  <div class="goal-card card card-glow" onclick="openEditGoal('${g.id}')">
    <div class="goal-card-top">
      <div style="flex:1;min-width:0">
        <div class="goal-meta-row">
          ${statusBadge(g.status)}
          ${priorityBadge(g.priority)}
        </div>
        <h4 class="goal-title">${esc(g.title)}</h4>
        ${g.description ? `<p class="goal-desc text-small">${esc(g.description.slice(0,80))}${g.description.length>80?"…":""}</p>` : ""}
      </div>
      <div class="goal-cat-icon">${catIcons[g.category] || "🎯"}</div>
    </div>
    <div class="goal-progress-area">
      <div class="flex justify-between" style="font-size:.78rem;color:var(--text-2);margin-bottom:6px">
        <span>${g.category || "personal"}</span>
        <span style="color:var(--indigo);font-weight:700">${g.progress}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${g.progress}%"></div></div>
    </div>
    <div class="goal-footer">
      <span class="text-small text-muted">${g.deadline ? "📅 " + fmtDate(g.deadline) : "No deadline"}</span>
      <div class="goal-actions">
        <button class="btn btn-icon btn-ghost btn-sm" onclick="event.stopPropagation();openEditGoal('${g.id}')" title="Edit">✏️</button>
        <button class="btn btn-icon btn-danger btn-sm" onclick="event.stopPropagation();deleteGoal('${g.id}')" title="Delete">🗑️</button>
      </div>
    </div>
  </div>`;
}

// ── Notifications ─────────────────────────
async function loadNotifications() {
  try {
    const { notifications } = await Notifications.get();
    const panel = document.getElementById("notif-panel");
    if (!panel) return;
    if (!notifications.length) {
      panel.innerHTML = `<p class="text-small text-muted" style="padding:12px 16px">No new notifications</p>`;
      document.querySelector(".notif-dot")?.remove();
      return;
    }
    panel.innerHTML = notifications.map(n => `
      <div class="notif-item">
        <div class="notif-title">${esc(n.title || "")}</div>
        <div class="notif-msg text-small text-muted">${esc(n.message)}</div>
        <div class="notif-time text-small" style="color:var(--text-3)">${timeAgo(n.created_at)}</div>
      </div>`).join("");
  } catch {}
}

// ── Recent Focus ───────────────────────────
async function loadRecentFocus() {
  try {
    const { sessions } = await Focus.history();
    const list = document.getElementById("recent-sessions");
    if (!list) return;
    if (!sessions.length) {
      list.innerHTML = `<p class="text-small text-muted">No sessions yet. Start a Pomodoro! 🍅</p>`;
      return;
    }
    list.innerHTML = sessions.slice(0, 4).map(s => `
      <div class="session-row">
        <div>
          <div class="fw-700 text-small">${esc(s.subject || "Study Session")}</div>
          <div class="text-small text-muted">${fmtDate(s.session_date)}</div>
        </div>
        <div class="session-dur">${s.duration_min} min</div>
      </div>`).join("");
  } catch {}
}

// ── Goal Modal ─────────────────────────────
let editingId = null;

function setupGoalModal() {
  document.getElementById("add-goal-btn")?.addEventListener("click", openAddGoal);
  document.getElementById("goal-form")?.addEventListener("submit", submitGoal);
}

function openAddGoal() {
  editingId = null;
  document.getElementById("modal-title").textContent = "New Goal";
  document.getElementById("goal-form").reset();
  document.getElementById("edit-only-row").style.display = "none";
  document.getElementById("submit-goal-btn").textContent = "Create Goal";
  openModal("goal-modal");
}

async function openEditGoal(id) {
  editingId = id;
  document.getElementById("modal-title").textContent = "Edit Goal";
  openModal("goal-modal");
  try {
    const { goals } = await Goals.getAll();
    const g = goals.find(x => x.id === id);
    if (!g) return;
    document.getElementById("g-title").value    = g.title || "";
    document.getElementById("g-desc").value     = g.description || "";
    document.getElementById("g-category").value = g.category || "personal";
    document.getElementById("g-priority").value = g.priority || "medium";
    document.getElementById("g-deadline").value = g.deadline || "";
    document.getElementById("g-status").value   = g.status || "not_started";
    document.getElementById("g-progress").value = g.progress || 0;
    document.getElementById("edit-only-row").style.display = "grid";
    document.getElementById("submit-goal-btn").textContent = "Save Changes";
  } catch {}
}

async function submitGoal(e) {
  e.preventDefault();
  const btn  = document.getElementById("submit-goal-btn");
  const data = {
    title:       document.getElementById("g-title").value.trim(),
    description: document.getElementById("g-desc").value.trim(),
    category:    document.getElementById("g-category").value,
    priority:    document.getElementById("g-priority").value,
    deadline:    document.getElementById("g-deadline").value || null,
    status:      document.getElementById("g-status")?.value   || "not_started",
    progress:    parseInt(document.getElementById("g-progress")?.value || 0),
  };
  if (!data.title) { showToast("Title is required", "error"); return; }
  btn.disabled = true;
  btn.textContent = "Saving…";
  try {
    if (editingId) { await Goals.update(editingId, data); showToast("Goal updated ✅", "success"); }
    else           { await Goals.create(data);            showToast("Goal created 🎯", "success"); }
    closeModal("goal-modal");
    await loadGoals();
    await loadSummary();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = editingId ? "Save Changes" : "Create Goal";
  }
}

async function deleteGoal(id) {
  if (!confirm("Delete this goal?")) return;
  try {
    await Goals.delete(id);
    showToast("Goal deleted", "info");
    await loadGoals();
    await loadSummary();
  } catch (err) { showToast(err.message, "error"); }
}

// ── Notifications toggle ───────────────────
document.addEventListener("DOMContentLoaded", () => {
  const btn   = document.getElementById("notif-btn");
  const panel = document.getElementById("notif-dropdown");
  btn?.addEventListener("click", async (e) => {
    e.stopPropagation();
    panel?.classList.toggle("open");
    if (panel?.classList.contains("open")) {
      await Notifications.markRead();
      document.querySelector(".notif-dot")?.remove();
    }
  });
  document.addEventListener("click", () => panel?.classList.remove("open"));
});