// ═══════════════════════════════════════════
//  PathPilot v2 — Pomodoro Focus Timer
// ═══════════════════════════════════════════

const MODES = {
  pomodoro: { label: "Focus",       minutes: 25, color: "#6366f1" },
  short:    { label: "Short Break", minutes: 5,  color: "#10b981" },
  long:     { label: "Long Break",  minutes: 15, color: "#22d3ee" },
};

let currentMode        = "pomodoro";
let secondsLeft        = MODES.pomodoro.minutes * 60;
let timerRunning       = false;
let timerInterval      = null;
let pomodorosCompleted = 0;
let sessionSubject     = "";

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;
  updateDisplay();
  await loadStats();
  await loadGoals();

  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      switchMode(btn.dataset.mode);
    });
  });

  document.getElementById("start-btn")?.addEventListener("click", toggleTimer);
  document.getElementById("reset-btn")?.addEventListener("click", resetTimer);
  document.getElementById("subject-input")?.addEventListener("input", (e) => {
    sessionSubject = e.target.value.trim();
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => Auth.logout());
});

function switchMode(mode) {
  currentMode  = mode;
  secondsLeft  = MODES[mode].minutes * 60;
  timerRunning = false;
  clearInterval(timerInterval);
  updateDisplay();
  updateTimerColor(mode);
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById("start-btn").textContent = "▶ Resume";
    document.getElementById("start-btn").classList.replace("btn-primary", "btn-ghost");
  } else {
    timerRunning = true;
    document.getElementById("start-btn").textContent = "⏸ Pause";
    document.getElementById("start-btn").classList.replace("btn-ghost", "btn-primary");
    timerInterval = setInterval(tick, 1000);
  }
}

function tick() {
  if (secondsLeft <= 0) {
    clearInterval(timerInterval);
    timerRunning = false;
    onTimerComplete();
    return;
  }
  secondsLeft--;
  updateDisplay();
}

function updateDisplay() {
  const m  = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const s  = (secondsLeft % 60).toString().padStart(2, "0");
  const el = document.getElementById("timer-display");
  if (el) el.textContent = `${m}:${s}`;
  document.title = `${m}:${s} — PathPilot Focus`;

  const total = MODES[currentMode].minutes * 60;
  const pct   = ((total - secondsLeft) / total) * 100;
  const circleEl = document.getElementById("timer-ring");
  if (circleEl) {
    const circumference = 2 * Math.PI * 122;
    circleEl.style.strokeDasharray  = circumference;
    circleEl.style.strokeDashoffset = circumference - (pct / 100) * circumference;
  }
}

function updateTimerColor(mode) {
  const color = MODES[mode].color;
  const ring  = document.getElementById("timer-ring");
  if (ring) ring.style.stroke = color;
}

async function onTimerComplete() {
  pomodorosCompleted++;
  document.getElementById("start-btn").textContent = "▶ Start";
  document.getElementById("start-btn").classList.replace("btn-primary", "btn-ghost");

  // Sound notification
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(550, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {}

  if (currentMode === "pomodoro") {
    const duration = MODES.pomodoro.minutes;
    showToast(`🔥 ${duration}-min focus session complete!`, "success", 4000);

    const countEl = document.getElementById("sessions-count");
    if (countEl) countEl.textContent = pomodorosCompleted;

    // Update session dots
    for (let i = 1; i <= 4; i++) {
      const chip = document.getElementById(`chip-${i}`);
      if (chip && i <= pomodorosCompleted % 4) chip.classList.add("done");
    }

    try {
      await Focus.log({
        subject:      sessionSubject || "General Study",
        duration_min: duration,
        type:         "pomodoro",
      });
      await loadStats();
    } catch (err) {
      console.warn("Could not log session:", err.message);
    }

    const nextMode = pomodorosCompleted % 4 === 0 ? "long" : "short";
    setTimeout(() => {
      document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
      document.querySelector(`[data-mode="${nextMode}"]`)?.classList.add("active");
      switchMode(nextMode);
    }, 1500);
  } else {
    showToast("Break over! Time to focus 💪", "info");
    setTimeout(() => {
      document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
      document.querySelector('[data-mode="pomodoro"]')?.classList.add("active");
      switchMode("pomodoro");
    }, 1500);
  }
}

async function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;

  const total   = MODES[currentMode].minutes * 60;
  const studied = total - secondsLeft;
  if (currentMode === "pomodoro" && studied >= 60) {
    try {
      await Focus.log({
        subject:      sessionSubject || "General Study",
        duration_min: Math.round(studied / 60),
        type:         "pomodoro",
      });
      showToast("✅ Session saved!", "success");
      await loadStats();
    } catch (err) {
      console.warn("Could not log session:", err.message);
    }
  }

  secondsLeft = MODES[currentMode].minutes * 60;
  document.getElementById("start-btn").textContent = "▶ Start";
  document.getElementById("start-btn").classList.replace("btn-primary", "btn-ghost");
  updateDisplay();
}

async function loadStats() {
  try {
    const data = await Focus.stats();
    const { weekly, total_hours, streak_days } = data;
    document.getElementById("stat-total-hours").textContent = total_hours || 0;
    document.getElementById("stat-streak").textContent      = streak_days || 0;
    renderWeeklyChart(weekly || []);
  } catch {}
}

function renderWeeklyChart(weekly) {
  const chart = document.getElementById("weekly-chart");
  if (!chart) return;

  const days  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const today = new Date();
  const map   = {};
  weekly.forEach(w => { map[w.session_date] = w.total_min; });
  const max = Math.max(...Object.values(map), 60);

  chart.innerHTML = days.map((day, i) => {
    const d    = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key  = d.toISOString().slice(0, 10);
    const mins = map[key] || 0;
    const pct  = Math.round((mins / max) * 100);
    const isToday = key === today.toISOString().slice(0, 10);
    return `
      <div class="chart-col">
        <div class="chart-bar-wrap">
          <div class="chart-bar ${isToday ? 'today' : ''}" style="height:${pct}%" title="${mins} min"></div>
        </div>
        <div class="chart-label">${day}</div>
        <div class="chart-mins">${mins ? Math.round(mins/60*10)/10+'h' : ''}</div>
      </div>`;
  }).join("");
}

async function loadGoals() {
  try {
    const { goals } = await Goals.getAll();
    const datalist  = document.getElementById("goal-suggestions");
    if (datalist) datalist.innerHTML = goals.map(g => `<option value="${esc(g.title)}">`).join("");
  } catch {}
}
