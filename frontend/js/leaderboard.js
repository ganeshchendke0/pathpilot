document.addEventListener("DOMContentLoaded", async () => {
  await loadWeeklyBoard();
  await loadAllTimeBoard();
  if (Auth.isLoggedIn()) await loadMyRank();

  document.querySelectorAll(".board-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".board-tab-btn").forEach((item) => item.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".board-panel").forEach((panel) => {
        panel.style.display = "none";
      });
      document.getElementById(btn.dataset.panel).style.display = "block";
    });
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => Auth.logout());
});

async function loadWeeklyBoard() {
  const list = document.getElementById("weekly-board");
  if (!list) return;

  list.innerHTML = getLoadingMarkup("Loading weekly leaderboard...");

  try {
    const { leaderboard } = await Leaderboard.weekly();
    renderBoard(leaderboard, list, "focus_minutes", "min focus");
  } catch (err) {
    list.innerHTML = getErrorMarkup(err.message);
  }
}

async function loadAllTimeBoard() {
  const list = document.getElementById("alltime-board");
  if (!list) return;

  list.innerHTML = getLoadingMarkup("Loading all-time leaderboard...");

  try {
    const { leaderboard } = await Leaderboard.allTime();
    renderBoard(leaderboard, list, "xp_points", "XP");
  } catch (err) {
    list.innerHTML = getErrorMarkup(err.message);
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
    container.innerHTML = getEmptyMarkup("No leaderboard data yet", "Complete a focus session to be the first on the board.");
    return;
  }

  const currentUser = Auth.currentUser();
  const medals = ["#1", "#2", "#3"];

  container.innerHTML = entries.map((entry, index) => {
    const isMe = currentUser && entry.id === currentUser.id;
    const score = entry[scoreKey] || 0;
    const initials = (entry.name || "?").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

    return `
      <div class="board-row ${isMe ? "is-me" : ""}">
        <div class="board-rank">${medals[index] || `#${index + 1}`}</div>
        <div class="board-avatar">${initials}</div>
        <div class="board-info">
          <div class="fw-700">${esc(entry.name)} ${isMe ? "<span class='badge badge-cyan' style='font-size:.65rem'>You</span>" : ""}</div>
          <div class="text-small text-muted">${esc(entry.college || "")}</div>
        </div>
        <div class="board-score">
          <div class="fw-700" style="color:var(--indigo)">${score}</div>
          <div class="text-small text-muted">${scoreLabel}</div>
        </div>
      </div>`;
  }).join("");
}
