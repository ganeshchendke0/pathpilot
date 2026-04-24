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

function renderWelcome(user) {
  const nameEl = document.getElementById("welcome-name");
  const xpEl = document.getElementById("user-xp");
  const streakEl = document.getElementById("user-streak");
  const streakHighlightEl = document.getElementById("streak-highlight");
  const firstName = user?.name?.split(" ")[0] || "Student";
  const xp = user?.xp_points || 0;
  const streak = user?.streak_days || 0;

  if (nameEl) nameEl.textContent = firstName;
  if (xpEl) xpEl.textContent = `${xp} XP`;
  if (streakEl) streakEl.textContent = `${streak} day streak`;
  if (streakHighlightEl) streakHighlightEl.textContent = streak;

  const hour = new Date().getHours();
  const greetEl = document.getElementById("greeting");
  if (greetEl) {
    greetEl.textContent =
      hour < 12 ? "Good morning!" :
      hour < 17 ? "Good afternoon!" :
      "Good evening!";
  }

  updateXpRing(xp);
}

function updateXpRing(xp) {
  const ringEl = document.getElementById("xp-ring-fill");
  const pctEl = document.getElementById("xp-progress-text");
  if (!ringEl || !pctEl) return;

  const target = 1500;
  const pct = Math.max(0, Math.min(100, Math.round((xp / target) * 100)));
  const circumference = 2 * Math.PI * 48;
  ringEl.style.strokeDasharray = circumference;
  ringEl.style.strokeDashoffset = circumference - (pct / 100) * circumference;
  pctEl.textContent = `${pct}%`;
}

async function loadSummary() {
  try {
    const { summary } = await Goals.summary();
    const focusData = await Focus.stats();

    setText("stat-total", summary.total || 0);
    setText("stat-completed", summary.completed || 0);
    setText("stat-inprog", summary.in_progress || 0);
    setText("stat-hours", focusData.total_hours || 0);

    document.querySelectorAll(".stat-num").forEach((el) => {
      const target = parseInt(el.textContent, 10) || 0;
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

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function loadWeeklyReport() {
  try {
    const { report } = await AI.weeklyReport();
    const summaryEl = document.getElementById("weekly-summary");
    if (summaryEl) {
      summaryEl.textContent = report.summary || "Log study sessions and mood to unlock your weekly insights.";
    }

    setText("report-focus", `${Math.floor((report.focus_minutes || 0) / 60)}h ${(report.focus_minutes || 0) % 60}m`);
    setText("report-goals", report.goals_completed || 0);
    setText("report-mood", report.avg_mood ? `${report.avg_mood}/5` : "-");
    setText("report-streak", `${report.streak_days || 0} days`);
  } catch {}
}

async function loadGoals() {
  const grid = document.getElementById("goals-grid");
  if (!grid) return;

  try {
    const { goals } = await Goals.getAll();
    if (!goals.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-emoji">+</div>
          <div class="empty-title">No goals yet</div>
          <p class="empty-sub">Set your first goal to start building momentum.</p>
        </div>`;
      return;
    }

    grid.innerHTML = goals.map((goal) => goalCard(goal)).join("");
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p class="empty-sub">${err.message}</p></div>`;
  }
}

function goalCard(goal) {
  const catIcons = { academic: "A", career: "C", personal: "P", skill: "S" };
  const description = goal.description ? esc(goal.description.slice(0, 80)) : "";
  const needsEllipsis = goal.description && goal.description.length > 80;

  return `
    <div class="goal-card card card-glow" onclick="openEditGoal('${goal.id}')">
      <div class="goal-card-top">
        <div style="flex:1;min-width:0">
          <div class="goal-meta-row">
            ${statusBadge(goal.status)}
            ${priorityBadge(goal.priority)}
          </div>
          <h4 class="goal-title">${esc(goal.title)}</h4>
          ${description ? `<p class="goal-desc text-small">${description}${needsEllipsis ? "..." : ""}</p>` : ""}
        </div>
        <div class="goal-cat-icon">${catIcons[goal.category] || "G"}</div>
      </div>
      <div class="goal-progress-area">
        <div class="flex justify-between" style="font-size:.78rem;color:var(--text-2);margin-bottom:6px">
          <span>${goal.category || "personal"}</span>
          <span style="color:var(--indigo);font-weight:700">${goal.progress}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${goal.progress}%"></div></div>
      </div>
      <div class="goal-footer">
        <span class="text-small text-muted">${goal.deadline ? fmtDate(goal.deadline) : "No deadline"}</span>
        <div class="goal-actions">
          <button class="btn btn-icon btn-ghost btn-sm" onclick="event.stopPropagation();openEditGoal('${goal.id}')" title="Edit">E</button>
          <button class="btn btn-icon btn-danger btn-sm" onclick="event.stopPropagation();deleteGoal('${goal.id}')" title="Delete">D</button>
        </div>
      </div>
    </div>`;
}

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

    panel.innerHTML = notifications.map((item) => `
      <div class="notif-item">
        <div class="notif-title">${esc(item.title || "")}</div>
        <div class="notif-msg text-small text-muted">${esc(item.message)}</div>
        <div class="notif-time text-small" style="color:var(--text-3)">${timeAgo(item.created_at)}</div>
      </div>`).join("");
  } catch {}
}

async function loadRecentFocus() {
  try {
    const { sessions } = await Focus.history();
    const list = document.getElementById("recent-sessions");
    if (!list) return;

    if (!sessions.length) {
      list.innerHTML = `<p class="text-small text-muted">No sessions yet. Start a focus session to build your streak.</p>`;
      return;
    }

    list.innerHTML = sessions.slice(0, 4).map((session) => `
      <div class="session-row">
        <div>
          <div class="fw-700 text-small">${esc(session.subject || "Study Session")}</div>
          <div class="text-small text-muted">${fmtDate(session.session_date)}</div>
        </div>
        <div class="session-dur">${session.duration_min} min</div>
      </div>`).join("");
  } catch {}
}

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
    const goal = goals.find((item) => item.id === id);
    if (!goal) return;

    document.getElementById("g-title").value = goal.title || "";
    document.getElementById("g-desc").value = goal.description || "";
    document.getElementById("g-category").value = goal.category || "personal";
    document.getElementById("g-priority").value = goal.priority || "medium";
    document.getElementById("g-deadline").value = goal.deadline || "";
    document.getElementById("g-status").value = goal.status || "not_started";
    document.getElementById("g-progress").value = goal.progress || 0;
    document.getElementById("edit-only-row").style.display = "grid";
    document.getElementById("submit-goal-btn").textContent = "Save Changes";
  } catch {}
}

async function submitGoal(event) {
  event.preventDefault();
  const btn = document.getElementById("submit-goal-btn");
  const data = {
    title: document.getElementById("g-title").value.trim(),
    description: document.getElementById("g-desc").value.trim(),
    category: document.getElementById("g-category").value,
    priority: document.getElementById("g-priority").value,
    deadline: document.getElementById("g-deadline").value || null,
    status: document.getElementById("g-status")?.value || "not_started",
    progress: parseInt(document.getElementById("g-progress")?.value || 0, 10),
  };

  if (!data.title) {
    showToast("Title is required", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    if (editingId) {
      await Goals.update(editingId, data);
      showToast("Goal updated", "success");
    } else {
      await Goals.create(data);
      showToast("Goal created", "success");
    }

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
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("notif-btn");
  const panel = document.getElementById("notif-dropdown");

  btn?.addEventListener("click", async (event) => {
    event.stopPropagation();
    panel?.classList.toggle("open");
    if (panel?.classList.contains("open")) {
      await Notifications.markRead();
      document.querySelector(".notif-dot")?.remove();
    }
  });

  document.addEventListener("click", () => panel?.classList.remove("open"));
});
