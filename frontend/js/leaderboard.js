// ═══════════════════════════════════════════
//  PathPilot v2 — Leaderboard
// ═══════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async () => {
  await loadWeeklyBoard();
  await loadAllTimeBoard();
  if (Auth.isLoggedIn()) await loadMyRank();

  document.querySelectorAll(".board-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".board-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".board-panel").forEach(p => p.style.display = "none");
      document.getElementById(btn.dataset.panel).style.display = "block";
    });
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => Auth.logout());
});

async function loadWeeklyBoard() {
  const list = document.getElementById("weekly-board");
  try {
    const { leaderboard } = await Leaderboard.weekly();
    renderBoard(leaderboard, list, "focus_minutes", "min focus");
  } catch (err) {
    list.innerHTML = `<p class="text-muted text-small">${err.message}</p>`;
  }
}

async function loadAllTimeBoard() {
  const list = document.getElementById("alltime-board");
  try {
    const { leaderboard } = await Leaderboard.allTime();
    renderBoard(leaderboard, list, "xp_points", "XP");
  } catch (err) {
    list.innerHTML = `<p class="text-muted text-small">${err.message}</p>`;
  }
}

async function loadMyRank() {
  try {
    const { rank } = await Leaderboard.myRank();
    const el = document.getElementById("my-rank");
    if (el) el.textContent = rank ? `#${rank}` : "Unranked";
  } catch {}
}

function renderBoard(entries, container, scoreKey, scoreLabel) {
  if (!entries || !entries.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">🏆</div>
        <div class="empty-title">No data yet</div>
        <p class="empty-sub">Be the first on the board!</p>
      </div>`;
    return;
  }

  const currentUser = Auth.currentUser();
  const medals      = ["🥇", "🥈", "🥉"];

  container.innerHTML = entries.map((e, i) => {
    const isMe     = currentUser && e.id === currentUser.id;
    const score    = e[scoreKey] || 0;
    const initials = (e.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return `
      <div class="board-row ${isMe ? "is-me" : ""}">
        <div class="board-rank">${medals[i] || `#${i + 1}`}</div>
        <div class="board-avatar">${initials}</div>
        <div class="board-info">
          <div class="fw-700">${esc(e.name)} ${isMe ? "<span class='badge badge-cyan' style='font-size:.65rem'>You</span>" : ""}</div>
          <div class="text-small text-muted">${esc(e.college || "")}</div>
        </div>
        <div class="board-score">
          <div class="fw-700" style="color:var(--indigo)">${score}</div>
          <div class="text-small text-muted">${scoreLabel}</div>
        </div>
      </div>`;
  }).join("");
}