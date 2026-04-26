document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;

  const chart = document.getElementById("mood-chart");
  const historyList = document.getElementById("mood-history-list");
  if (chart) chart.innerHTML = getLoadingMarkup("Loading mood trends...");
  if (historyList) historyList.innerHTML = getLoadingMarkup("Loading mood history...");

  await loadInsights();
  await loadHistory();
  setupMoodForm();
  document.getElementById("logout-btn")?.addEventListener("click", () => Auth.logout());
});

let selectedMood = 0;

function setupMoodForm() {
  document.querySelectorAll(".mood-emoji-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mood-emoji-btn").forEach((item) => item.classList.remove("selected"));
      btn.classList.add("selected");
      selectedMood = parseInt(btn.dataset.score, 10);
    });
  });

  document.getElementById("mood-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selectedMood) {
      showToast("Please select your mood", "warning");
      return;
    }

    const data = {
      mood_score: selectedMood,
      energy: parseInt(document.getElementById("m-energy").value, 10) || null,
      stress: parseInt(document.getElementById("m-stress").value, 10) || null,
      sleep_hours: parseFloat(document.getElementById("m-sleep").value) || null,
      note: document.getElementById("m-note").value.trim(),
      tags: getSelectedTags(),
    };

    const btn = event.target.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
      await Wellness.log(data);
      showToast("Mood logged", "success");
      await loadInsights();
      await loadHistory();
      event.target.reset();
      selectedMood = 0;
      document.querySelectorAll(".mood-emoji-btn").forEach((item) => item.classList.remove("selected"));
      document.querySelectorAll(".tag-chip").forEach((tag) => tag.classList.remove("active"));
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Log Today's Mood";
    }
  });

  document.querySelectorAll(".tag-chip").forEach((chip) => {
    chip.addEventListener("click", () => chip.classList.toggle("active"));
  });
}

function getSelectedTags() {
  return Array.from(document.querySelectorAll(".tag-chip.active")).map((tag) => tag.dataset.tag);
}

async function loadInsights() {
  try {
    const data = await Wellness.insights();
    const levelColors = {
      low: "var(--emerald)",
      medium: "var(--amber)",
      high: "var(--rose)",
      unknown: "var(--text-2)"
    };
    const color = levelColors[data.level] || "var(--text-2)";

    const scoreEl = document.getElementById("burnout-score");
    const levelEl = document.getElementById("burnout-level");
    const tipEl = document.getElementById("burnout-tip");
    const moodEl = document.getElementById("avg-mood");

    if (scoreEl) {
      scoreEl.textContent = data.score || "-";
      scoreEl.style.color = color;
    }
    if (levelEl) {
      levelEl.textContent = (data.level || "unknown").toUpperCase();
      levelEl.style.color = color;
    }
    if (tipEl) tipEl.textContent = data.tip || "";
    if (moodEl) moodEl.textContent = data.avg_mood || "-";
  } catch {}
}

async function loadHistory() {
  const chart = document.getElementById("mood-chart");
  const historyList = document.getElementById("mood-history-list");

  try {
    const { history } = await Wellness.history(14);
    renderMoodChart(history);
    renderMoodHistory(history);
  } catch (err) {
    if (chart) chart.innerHTML = getErrorMarkup(err.message);
    if (historyList) historyList.innerHTML = getErrorMarkup(err.message);
  }
}

function renderMoodChart(entries) {
  const chart = document.getElementById("mood-chart");
  if (!chart) return;

  if (!entries.length) {
    chart.innerHTML = `<p class="text-small text-muted" style="padding:20px 0">No trend data yet. Start logging your mood to see patterns.</p>`;
    return;
  }

  const moodEmojis = { 1: "Sad", 2: "Low", 3: "Okay", 4: "Good", 5: "Great" };
  const moodColors = { 1: "#f43f5e", 2: "#f97316", 3: "#f59e0b", 4: "#22d3ee", 5: "#10b981" };
  const last7 = entries.slice(0, 7).reverse();

  chart.innerHTML = `
    <div class="mood-bars">
      ${last7.map((entry) => {
        const pct = (entry.mood_score / 5) * 100;
        const color = moodColors[entry.mood_score] || "var(--indigo)";
        const date = new Date(entry.entry_date).toLocaleDateString("en-IN", { weekday: "short" });
        return `
          <div class="mood-bar-col">
            <span class="mood-bar-emoji">${moodEmojis[entry.mood_score]}</span>
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
    list.innerHTML = getEmptyMarkup("No entries yet", "Log your first mood entry above.");
    return;
  }

  const moodEmojis = { 1: "Sad", 2: "Low", 3: "Okay", 4: "Good", 5: "Great" };
  const moodLabels = { 1: "Very Low", 2: "Low", 3: "Okay", 4: "Good", 5: "Great" };

  list.innerHTML = entries.map((entry) => `
    <div class="mood-entry-card">
      <div class="mood-entry-left">
        <span class="mood-entry-emoji">${moodEmojis[entry.mood_score]}</span>
        <div>
          <div class="mood-entry-label">${moodLabels[entry.mood_score]}</div>
          <div class="mood-entry-date text-small text-muted">${fmtDate(entry.entry_date)}</div>
        </div>
      </div>
      <div class="mood-entry-right">
        ${entry.stress ? `<span class="badge badge-rose">Stress ${entry.stress}/5</span>` : ""}
        ${entry.energy ? `<span class="badge badge-cyan">Energy ${entry.energy}/5</span>` : ""}
        ${entry.sleep_hours ? `<span class="badge badge-emerald">Sleep ${entry.sleep_hours}h</span>` : ""}
      </div>
      ${entry.note ? `<div class="mood-entry-note text-muted text-small">${esc(entry.note)}</div>` : ""}
    </div>`).join("");
}
