// ═══════════════════════════════════════════
//  PathPilot v2 — Learning Roadmap
// ═══════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;
  await loadRoadmaps();
  document.getElementById("logout-btn")?.addEventListener("click", () => Auth.logout());
});

async function loadRoadmaps() {
  const container = document.getElementById("roadmaps-container");
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-emoji">⏳</div>
      <p>Loading your roadmaps…</p>
    </div>`;

  try {
    const { roadmaps } = await Roadmap.getAll();
    if (!roadmaps.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-emoji">🗺️</div>
          <div class="empty-title">No roadmaps yet</div>
          <p class="empty-sub">Explore career paths and click "Build Roadmap" to auto-generate a week-by-week learning plan.</p>
          <a href="career.html" class="btn btn-primary" style="margin-top:20px">Explore Careers →</a>
        </div>`;
      return;
    }
    container.innerHTML = roadmaps.map(r => renderRoadmap(r)).join("");
  } catch (err) {
    container.innerHTML = `<p style="color:var(--rose)">${err.message}</p>`;
  }
}

function renderRoadmap(r) {
  const milestones  = r.milestones || [];
  const done        = milestones.filter(m => m.is_done).length;
  const total       = milestones.length;
  const progressPct = r.progress_pct || 0;

  return `
  <div class="roadmap-card card card-glow">
    <div class="roadmap-header">
      <div>
        <h3 class="roadmap-title">${esc(r.title)}</h3>
        <div class="flex gap-sm items-center" style="margin-top:6px">
          <span class="badge badge-indigo">📅 ${r.total_weeks} weeks</span>
          <span class="text-small text-muted">${done}/${total} milestones done</span>
        </div>
      </div>
      <div class="roadmap-pct-badge">${progressPct}%</div>
    </div>
    <div class="progress-bar" style="margin:14px 0">
      <div class="progress-fill" style="width:${progressPct}%"></div>
    </div>
    <div class="milestones-list">
      ${milestones.map(ms => renderMilestone(ms)).join("")}
    </div>
  </div>`;
}

function renderMilestone(ms) {
  return `
  <div class="milestone-row ${ms.is_done ? 'done' : ''}" onclick="toggleMilestone('${ms.id}', this)">
    <div class="ms-check">${ms.is_done ? "✅" : "⭕"}</div>
    <div class="ms-body">
      <div class="ms-week text-small text-muted">Week ${ms.week_number}</div>
      <div class="ms-title">${esc(ms.title)}</div>
      ${ms.description ? `<div class="ms-desc text-small text-muted">${esc(ms.description)}</div>` : ""}
      ${(ms.resources || []).length ? `
        <div class="ms-resources">
          ${ms.resources.map(r => `<span class="skill-chip">📚 ${esc(r)}</span>`).join("")}
        </div>` : ""}
    </div>
  </div>`;
}

async function toggleMilestone(id, rowEl) {
  try {
    const { milestone } = await Roadmap.toggle(id);
    rowEl.classList.toggle("done", milestone.is_done);
    rowEl.querySelector(".ms-check").textContent = milestone.is_done ? "✅" : "⭕";
    if (milestone.is_done) showToast("Milestone completed! +50 XP ⚡", "success");
    setTimeout(loadRoadmaps, 400);
  } catch (err) {
    showToast(err.message, "error");
  }
}