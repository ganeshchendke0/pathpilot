document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;
  await loadRoadmaps();
  document.getElementById("logout-btn")?.addEventListener("click", () => Auth.logout());
});

async function loadRoadmaps() {
  const container = document.getElementById("roadmaps-container");
  if (!container) return;

  container.innerHTML = getLoadingMarkup("Loading your roadmaps...");

  try {
    const { roadmaps } = await Roadmap.getAll();
    if (!roadmaps.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">No roadmaps yet</div>
          <p class="empty-sub">Explore career paths and build a roadmap to generate a week-by-week learning plan.</p>
          <a href="career.html" class="btn btn-primary" style="margin-top:20px">Explore Careers</a>
        </div>`;
      return;
    }

    container.innerHTML = roadmaps.map((roadmap) => renderRoadmap(roadmap)).join("");
  } catch (err) {
    container.innerHTML = getErrorMarkup(err.message);
  }
}

function renderRoadmap(roadmap) {
  const milestones = roadmap.milestones || [];
  const done = milestones.filter((item) => item.is_done).length;
  const total = milestones.length;
  const progressPct = roadmap.progress_pct || 0;

  return `
    <div class="roadmap-card card card-glow">
      <div class="roadmap-header">
        <div>
          <h3 class="roadmap-title">${esc(roadmap.title)}</h3>
          <div class="flex gap-sm items-center" style="margin-top:6px">
            <span class="badge badge-indigo">${roadmap.total_weeks} weeks</span>
            <span class="text-small text-muted">${done}/${total} milestones done</span>
          </div>
        </div>
        <div class="roadmap-pct-badge">${progressPct}%</div>
      </div>
      <div class="progress-bar" style="margin:14px 0">
        <div class="progress-fill" style="width:${progressPct}%"></div>
      </div>
      <div class="milestones-list">
        ${milestones.map((milestone) => renderMilestone(milestone)).join("")}
      </div>
    </div>`;
}

function renderMilestone(milestone) {
  return `
    <div class="milestone-row ${milestone.is_done ? "done" : ""}" role="button" tabindex="0" aria-pressed="${milestone.is_done ? "true" : "false"}" onclick="toggleMilestone('${milestone.id}', this)" onkeydown="handleMilestoneKeydown(event, '${milestone.id}', this)">
      <div class="ms-check">${milestone.is_done ? "Done" : "Todo"}</div>
      <div class="ms-body">
        <div class="ms-week text-small text-muted">Week ${milestone.week_number}</div>
        <div class="ms-title">${esc(milestone.title)}</div>
        ${milestone.description ? `<div class="ms-desc text-small text-muted">${esc(milestone.description)}</div>` : ""}
        ${(milestone.resources || []).length ? `
          <div class="ms-resources">
            ${milestone.resources.map((resource) => `<span class="skill-chip">${esc(resource)}</span>`).join("")}
          </div>` : ""}
      </div>
    </div>`;
}

function handleMilestoneKeydown(event, id, rowEl) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  toggleMilestone(id, rowEl);
}

async function toggleMilestone(id, rowEl) {
  try {
    const { milestone } = await Roadmap.toggle(id);
    rowEl.classList.toggle("done", milestone.is_done);
    rowEl.querySelector(".ms-check").textContent = milestone.is_done ? "Done" : "Todo";
    rowEl.setAttribute("aria-pressed", milestone.is_done ? "true" : "false");
    if (milestone.is_done) showToast("Milestone completed! +50 XP", "success");
    setTimeout(loadRoadmaps, 400);
  } catch (err) {
    showToast(err.message, "error");
  }
}
