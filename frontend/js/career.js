// ═══════════════════════════════════════════
//  PathPilot v2 — Career Explorer + Quiz
// ═══════════════════════════════════════════

const FIELD_ICONS = {
  "Technology":"💻","Design":"🎨","Business":"📊",
  "Finance":"💹","Media":"🎬","Healthcare":"🏥","Education":"🎓"
};

document.addEventListener("DOMContentLoaded", async () => {
  await loadCareers();
  setupSearch();
  setupFilters();
  setupCareerModal();
  setupQuizModal();
  if (Auth.isLoggedIn()) loadSavedPaths();
  document.getElementById("logout-btn")?.addEventListener("click", () => Auth.logout());
});

// ── Career list ────────────────────────────
async function loadCareers(search = "", field = "") {
  const grid = document.getElementById("career-grid");
  grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-emoji">⏳</div><p>Loading careers…</p></div>`;
  try {
    const { career_paths } = await Career.getPaths(search, field);
    renderCareerCards(career_paths, grid);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p class="empty-sub">⚠️ ${err.message}</p></div>`;
  }
}

function renderCareerCards(paths, grid) {
  if (!paths.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-emoji">🔍</div><div class="empty-title">No results</div><p class="empty-sub">Try a different search</p></div>`;
    return;
  }
  grid.innerHTML = paths.map(p => careerCard(p)).join("");
}

function careerCard(p) {
  const icon   = p.icon_emoji || FIELD_ICONS[p.field] || "🌟";
  const skills = (p.required_skills || []).slice(0, 4);
  const extra  = (p.required_skills || []).length - 4;
  return `
  <div class="career-card" onclick="openCareerDetail('${p.id}')">
    <div class="career-card-top">
      <div class="career-icon-wrap">${icon}</div>
      <div class="career-card-info">
        <div class="career-title">${esc(p.title)}</div>
        <span class="badge badge-indigo">${p.field || "General"}</span>
      </div>
    </div>
    <p class="career-desc">${esc((p.description || "").slice(0,110))}…</p>
    <div class="career-stats-grid">
      <div class="career-stat-box">
        <div class="cstat-label">💰 India Salary</div>
        <div class="cstat-val">${p.avg_salary_inr || "N/A"}</div>
      </div>
      <div class="career-stat-box">
        <div class="cstat-label">📈 Growth</div>
        <div class="cstat-val">${(p.growth_rate || "N/A").split(" ")[0]}</div>
      </div>
      <div class="career-stat-box">
        <div class="cstat-label">⏱ Time to Entry</div>
        <div class="cstat-val">${p.time_to_entry || "N/A"}</div>
      </div>
      <div class="career-stat-box">
        <div class="cstat-label">🎯 Difficulty</div>
        <div class="cstat-val" style="text-transform:capitalize">${p.difficulty || "moderate"}</div>
      </div>
    </div>
    <div class="skill-chips">
      ${skills.map(s => `<span class="skill-chip">${esc(s)}</span>`).join("")}
      ${extra > 0 ? `<span class="skill-chip muted">+${extra} more</span>` : ""}
    </div>
    <div class="career-card-footer">
      <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openCareerDetail('${p.id}')">Explore →</button>
      ${Auth.isLoggedIn() ? `<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();saveCareer('${p.id}',this)">🔖 Save</button>` : ""}
    </div>
  </div>`;
}

// ── Career detail modal ────────────────────
async function openCareerDetail(id) {
  openModal("career-modal");
  const body = document.getElementById("career-modal-body");
  body.innerHTML = `<p class="text-muted">Loading…</p>`;
  try {
    const { career_path: p } = await Career.getPath(id);
    const icon = p.icon_emoji || FIELD_ICONS[p.field] || "🌟";
    body.innerHTML = `
      <div class="career-detail-hero">
        <div class="career-detail-icon">${icon}</div>
        <div>
          <h3>${esc(p.title)}</h3>
          <div class="flex gap-sm" style="margin-top:8px;flex-wrap:wrap">
            <span class="badge badge-indigo">${p.field}</span>
            <span class="badge badge-amber" style="text-transform:capitalize">🎯 ${p.difficulty}</span>
          </div>
        </div>
      </div>
      <p style="margin:16px 0;line-height:1.7">${esc(p.description || "")}</p>
      <div class="detail-stats-grid">
        <div class="detail-stat"><div class="ds-label">💰 India Salary</div><div class="ds-val">${p.avg_salary_inr || "N/A"}</div></div>
        <div class="detail-stat"><div class="ds-label">💵 Global Salary</div><div class="ds-val">${p.avg_salary_usd || "N/A"}</div></div>
        <div class="detail-stat"><div class="ds-label">📈 Growth Rate</div><div class="ds-val">${p.growth_rate || "N/A"}</div></div>
        <div class="detail-stat"><div class="ds-label">⏱ Time to Entry</div><div class="ds-val">${p.time_to_entry || "N/A"}</div></div>
      </div>
      <div class="detail-section">
        <div class="detail-section-label">✅ Required Skills</div>
        <div class="skill-chips">
          ${(p.required_skills||[]).map(s=>`<span class="skill-chip active">${esc(s)}</span>`).join("")}
        </div>
      </div>
      ${(p.nice_to_have_skills||[]).length ? `
      <div class="detail-section">
        <div class="detail-section-label">⭐ Nice to Have</div>
        <div class="skill-chips">
          ${p.nice_to_have_skills.map(s=>`<span class="skill-chip">${esc(s)}</span>`).join("")}
        </div>
      </div>` : ""}
      <div class="detail-section">
        <div class="detail-section-label">📚 Recommended Courses</div>
        ${(p.recommended_courses||[]).map(c=>`<div class="course-row">📖 ${esc(c)}</div>`).join("")}
      </div>
      ${(p.top_companies||[]).length ? `
      <div class="detail-section">
        <div class="detail-section-label">🏢 Top Companies</div>
        <div class="skill-chips">${p.top_companies.map(c=>`<span class="skill-chip">${esc(c)}</span>`).join("")}</div>
      </div>` : ""}
      ${(p.job_roles||[]).length ? `
      <div class="detail-section">
        <div class="detail-section-label">👔 Job Roles</div>
        <div class="skill-chips">${p.job_roles.map(r=>`<span class="skill-chip active">${esc(r)}</span>`).join("")}</div>
      </div>` : ""}
      <div class="detail-actions">
        ${Auth.isLoggedIn() ? `
        <button class="btn btn-primary" onclick="saveCareer('${p.id}',this)">🔖 Save Path</button>
        <button class="btn btn-ghost" onclick="showSkillGap('${p.id}')">🔍 Skill Gap</button>
        <button class="btn btn-ghost" onclick="buildRoadmap('${p.id}','${esc(p.title)}')">🗺️ Build Roadmap</button>
        ` : `<a href="index.html" class="btn btn-primary">Sign in to save & build roadmap →</a>`}
      </div>
      <div id="skill-gap-result" style="margin-top:16px"></div>
    `;
  } catch (err) {
    body.innerHTML = `<p style="color:var(--rose)">${err.message}</p>`;
  }
}

async function showSkillGap(careerId) {
  const container = document.getElementById("skill-gap-result");
  container.innerHTML = `<p class="text-muted text-small">Analysing your skill gap…</p>`;
  try {
    const data = await Career.skillGap(careerId);
    container.innerHTML = `
      <div class="skill-gap-box">
        <div class="sg-header">
          <span class="fw-700">Skill Gap Analysis</span>
          <span class="badge ${data.completion_pct >= 80 ? 'badge-emerald' : data.completion_pct >= 50 ? 'badge-amber' : 'badge-rose'}">${data.completion_pct}% Ready</span>
        </div>
        <p class="text-small" style="margin:8px 0;color:var(--text-2)">${data.readiness}</p>
        <div class="progress-bar" style="margin-bottom:12px"><div class="progress-fill" style="width:${data.completion_pct}%"></div></div>
        ${data.have?.length ? `<div class="sg-section"><span class="sg-label emerald">✅ You have (${data.have.length})</span><div class="skill-chips">${data.have.map(s=>`<span class="skill-chip" style="border-color:var(--emerald)">${esc(s)}</span>`).join("")}</div></div>` : ""}
        ${data.missing?.length ? `<div class="sg-section"><span class="sg-label rose">❌ Missing (${data.missing.length})</span><div class="skill-chips">${data.missing.map(s=>`<span class="skill-chip" style="border-color:var(--rose)">${esc(s)}</span>`).join("")}</div></div>` : ""}
      </div>`;
  } catch (err) {
    container.innerHTML = `<p class="text-small text-muted">Update your skills in Profile to see skill gap analysis.</p>`;
  }
}

async function buildRoadmap(careerId, careerTitle) {
  closeModal("career-modal");
  try {
    await Roadmap.create({ career_path_id: careerId, title: `${careerTitle} Roadmap`, total_weeks: 12 });
    showToast("🗺️ Roadmap created! Check your Roadmap page.", "success", 4000);
    setTimeout(() => window.location.href = "roadmap.html", 1500);
  } catch (err) { showToast(err.message, "error"); }
}

async function saveCareer(id, btn) {
  if (!Auth.isLoggedIn()) { window.location.href = "index.html"; return; }
  try {
    await Career.save(id);
    btn.textContent = "✅ Saved";
    btn.disabled = true;
    showToast("Career path saved!", "success");
  } catch (err) { showToast(err.message, "error"); }
}

async function loadSavedPaths() {
  try {
    const { saved_paths } = await Career.getSaved();
    const section = document.getElementById("saved-section");
    const grid    = document.getElementById("saved-grid");
    if (!section || !grid) return;
    if (!saved_paths.length) { section.style.display = "none"; return; }
    section.style.display = "block";
    grid.innerHTML = saved_paths.map(p => careerCard(p)).join("");
  } catch {}
}

// ── Search & Filters ───────────────────────
let searchTimer;
function setupSearch() {
  document.getElementById("career-search")?.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadCareers(e.target.value.trim(), activeField), 350);
  });
}

let activeField = "";
function setupFilters() {
  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeField = chip.dataset.field || "";
      loadCareers(document.getElementById("career-search")?.value || "", activeField);
    });
  });
}

function setupCareerModal() {
  document.getElementById("career-modal-close")?.addEventListener("click", () => closeModal("career-modal"));
}

// ── Career Quiz ────────────────────────────
let quizQuestions = [];
let quizAnswers   = [];
let currentQ      = 0;

function setupQuizModal() {
  document.getElementById("open-quiz-btn")?.addEventListener("click", startQuiz);
  document.getElementById("quiz-modal-close")?.addEventListener("click", () => closeModal("quiz-modal"));
}

async function startQuiz() {
  if (!Auth.isLoggedIn()) { showToast("Sign in to take the quiz", "warning"); return; }
  openModal("quiz-modal");
  const body = document.getElementById("quiz-body");
  body.innerHTML = `<p class="text-muted">Loading quiz…</p>`;
  try {
    const { questions } = await AI.quizQuestions();
    quizQuestions = questions;
    quizAnswers   = [];
    currentQ      = 0;
    renderQuestion();
  } catch (err) {
    body.innerHTML = `<p style="color:var(--rose)">${err.message}</p>`;
  }
}

function renderQuestion() {
  const body = document.getElementById("quiz-body");
  if (currentQ >= quizQuestions.length) { submitQuiz(); return; }
  const q    = quizQuestions[currentQ];
  const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
  const pct  = Math.round(((currentQ) / quizQuestions.length) * 100);

  body.innerHTML = `
    <div class="quiz-progress">
      <div class="flex justify-between text-small text-muted" style="margin-bottom:8px">
        <span>Question ${currentQ + 1} of ${quizQuestions.length}</span>
        <span>${pct}% done</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="quiz-question">${esc(q.question)}</div>
    <div class="quiz-options">
      ${opts.map((opt, i) => `
        <button class="quiz-option-btn" onclick="selectAnswer(${JSON.stringify(opt.tags)}, this)">
          <span class="qopt-letter">${String.fromCharCode(65 + i)}</span>
          <span>${esc(opt.text)}</span>
        </button>`).join("")}
    </div>`;
}

function selectAnswer(tags, btn) {
  document.querySelectorAll(".quiz-option-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  setTimeout(() => {
    quizAnswers.push(tags);
    currentQ++;
    renderQuestion();
  }, 400);
}

async function submitQuiz() {
  const body = document.getElementById("quiz-body");
  body.innerHTML = `<p class="text-muted text-center" style="padding:30px">✨ Analysing your answers…</p>`;
  try {
    const { matches } = await AI.quizSubmit(quizAnswers);
    renderQuizResults(matches);
  } catch (err) {
    body.innerHTML = `<p style="color:var(--rose)">${err.message}</p>`;
  }
}

function renderQuizResults(matches) {
  const body = document.getElementById("quiz-body");
  body.innerHTML = `
    <div class="quiz-results">
      <div class="text-center" style="margin-bottom:24px">
        <div style="font-size:2.5rem;margin-bottom:8px">🎉</div>
        <h3 style="margin-bottom:6px">Your Top Career Matches</h3>
        <p class="text-small text-muted">Based on your interests and strengths</p>
      </div>
      ${matches.map((m, i) => `
        <div class="quiz-result-row" onclick="closeModal('quiz-modal');openCareerDetail('${m.career_path_id}')">
          <div class="qr-rank">#${i + 1}</div>
          <div class="qr-info">
            <div class="fw-700">${esc(m.title)}</div>
            <div class="text-small text-muted">${m.field || ""}</div>
          </div>
          <div class="qr-score">
            <div class="fw-700" style="color:var(--indigo)">${m.score}%</div>
            <div class="text-small text-muted">match</div>
          </div>
        </div>`).join("")}
      <button class="btn btn-ghost w-full" style="margin-top:16px" onclick="closeModal('quiz-modal')">
        Explore These Careers →
      </button>
    </div>`;
}