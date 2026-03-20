// ═══════════════════════════════════════════
//  PathPilot v2 — Wellness Tracker
// ═══════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;
  await loadInsights();
  await loadHistory();
  setupMoodForm();
  document.getElementById("logout-btn")?.addEventListener("click", () => Auth.logout());
});

// ── Mood form ──────────────────────────────
let selectedMood = 0;

function setupMoodForm() {
  document.querySelectorAll(".mood-emoji-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mood-emoji-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedMood = parseInt(btn.dataset.score);
    });
  });

  document.getElementById("mood-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedMood) { showToast("Please select your mood", "warning"); return; }

    const data = {
      mood_score:  selectedMood,
      energy:      parseInt(document.getElementById("m-energy").value) || null,
      stress:      parseInt(document.getElementById("m-stress").value) || null,
      sleep_hours: parseFloat(document.getElementById("m-sleep").value) || null,
      note:        document.getElementById("m-note").value.trim(),
      tags:        getSelectedTags(),
    };

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Saving…";
    try {
      await Wellness.log(data);
      showToast("Mood logged! 🧘", "success");
      await loadInsights();
      await loadHistory();
      e.target.reset();
      selectedMood = 0;
      document.querySelectorAll(".mood-emoji-btn").forEach(b => b.classList.remove("selected"));
      document.querySelectorAll(".tag-chip").forEach(t => t.classList.remove("active"));
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Log Today's Mood 🧘";
    }
  });

  document.querySelectorAll(".tag-chip").forEach(chip => {
    chip.addEventListener("click", () => chip.classList.toggle("active"));
  });
}

function getSelectedTags() {
  return Array.from(document.querySelectorAll(".tag-chip.active")).map(t => t.dataset.tag);
}

// ── Insights ───────────────────────────────
async function loadInsights() {
  try {
    const data = await Wellness.insights();
    const levelColors = {
      low:     "var(--emerald)",
      medium:  "var(--amber)",
      high:    "var(--rose)",
      unknown: "var(--text-2)"
    };
    const color = levelColors[data.level] || "var(--text-2)";

    const scoreEl = document.getElementById("burnout-score");
    const levelEl = document.getElementById("burnout-level");
    const tipEl   = document.getElementById("burnout-tip");
    const moodEl  = document.getElementById("avg-mood");

    if (scoreEl) { scoreEl.textContent = data.score || "—"; scoreEl.style.color = color; }
    if (levelEl) { levelEl.textContent = (data.level || "unknown").toUpperCase(); levelEl.style.color = color; }
    if (tipEl)   tipEl.textContent = data.tip || "";
    if (moodEl)  moodEl.textContent = data.avg_mood || "—";
  } catch {}
}

// ── History ────────────────────────────────
async function loadHistory() {
  try {
    const { history } = await Wellness.history(14);
    renderMoodChart(history);
    renderMoodHistory(history);
  } catch {}
}

function renderMoodChart(entries) {
  const chart = document.getElementById("mood-chart");
  if (!chart || !entries.length) return;

  const moodEmojis = { 1:"😞", 2:"😕", 3:"😐", 4:"🙂", 5:"😄" };
  const moodColors = { 1:"#f43f5e", 2:"#f97316", 3:"#f59e0b", 4:"#22d3ee", 5:"#10b981" };
  const last7 = entries.slice(0, 7).reverse();

  chart.innerHTML = `
    <div class="mood-bars">
      ${last7.map(e => {
        const pct   = (e.mood_score / 5) * 100;
        const color = moodColors[e.mood_score] || "var(--indigo)";
        const date  = new Date(e.entry_date).toLocaleDateString("en-IN", { weekday:"short" });
        return `
          <div class="mood-bar-col">
            <span class="mood-bar-emoji">${moodEmojis[e.mood_score]}</span>
            <div class="mood-bar-track">
              <div class="mood-bar-fill" style="height:${pct}%;background:${color}"></div>
            </div>
            <span class="mood-bar-date">${date}</span>
          </div>`;
      }).join("")}
    </div>`;
}

function renderMoodHistory(entries) {
  const list = document.getElementById("mood-history-list");
  if (!list) return;

  if (!entries.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">🧘</div>
        <div class="empty-title">No entries yet</div>
        <p class="empty-sub">Log your first mood above</p>
      </div>`;
    return;
  }

  const moodEmojis = { 1:"😞", 2:"😕", 3:"😐", 4:"🙂", 5:"😄" };
  const moodLabels = { 1:"Very Low", 2:"Low", 3:"Okay", 4:"Good", 5:"Great" };

  list.innerHTML = entries.map(e => `
    <div class="mood-entry-card">
      <div class="mood-entry-left">
        <span class="mood-entry-emoji">${moodEmojis[e.mood_score]}</span>
        <div>
          <div class="mood-entry-label">${moodLabels[e.mood_score]}</div>
          <div class="mood-entry-date text-small text-muted">${fmtDate(e.entry_date)}</div>
        </div>
      </div>
      <div class="mood-entry-right">
        ${e.stress      ? `<span class="badge badge-rose">Stress ${e.stress}/5</span>`   : ""}
        ${e.energy      ? `<span class="badge badge-cyan">Energy ${e.energy}/5</span>`   : ""}
        ${e.sleep_hours ? `<span class="badge badge-emerald">💤 ${e.sleep_hours}h</span>` : ""}
      </div>
      ${e.note ? `<div class="mood-entry-note text-muted text-small">${esc(e.note)}</div>` : ""}
    </div>`).join("");
}