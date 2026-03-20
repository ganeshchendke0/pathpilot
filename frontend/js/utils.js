// ═══════════════════════════════════════════
//  PathPilot v2 — Shared Utilities
// ═══════════════════════════════════════════

// ── Toast ──────────────────────────────────
function showToast(message, type = "info", duration = 3500) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = Object.assign(document.createElement("div"), { className: "toast-container" });
    document.body.appendChild(container);
  }
  const icons = { success:"✅", error:"❌", info:"💡", warning:"⚠️" };
  const toast  = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]||"💡"}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "all 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
window.showToast = showToast;

// ── HTML escape ───────────────────────────
function esc(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}
window.esc = esc;

// ── Format date ───────────────────────────
function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}
window.fmtDate = fmtDate;

// ── Relative time ─────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
}
window.timeAgo = timeAgo;

// ── Guard: redirect to login if not authenticated ──
function requireAuth() {
  if (!Auth.isLoggedIn()) { window.location.href = "index.html"; return false; }
  return true;
}
window.requireAuth = requireAuth;

// ── Populate nav user info ─────────────────
function populateNavUser() {
  const user = Auth.currentUser();
  if (!user) return;
  const el = document.getElementById("nav-user-name");
  if (el) el.textContent = user.name?.split(" ")[0] || "Student";
  const xpEl = document.getElementById("nav-xp");
  if (xpEl && user.xp_points !== undefined) xpEl.textContent = `⚡ ${user.xp_points} XP`;
}
window.populateNavUser = populateNavUser;

// ── Status badge helper ────────────────────
function statusBadge(status) {
  const map = {
    completed:   ["badge-emerald", "✓ Completed"],
    in_progress: ["badge-cyan",    "⟳ In Progress"],
    not_started: ["badge-amber",   "○ Not Started"],
  };
  const [cls, label] = map[status] || ["badge-indigo", status];
  return `<span class="badge ${cls}">${label}</span>`;
}
window.statusBadge = statusBadge;

function priorityBadge(p) {
  const map = {
    high:   ["badge-rose",    "↑ High"],
    medium: ["badge-amber",   "→ Medium"],
    low:    ["badge-emerald", "↓ Low"]
  };
  const [cls, label] = map[p] || ["badge-indigo", p];
  return `<span class="badge ${cls}">${label}</span>`;
}
window.priorityBadge = priorityBadge;

// ── Modal helpers ─────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add("open"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }
window.openModal  = openModal;
window.closeModal = closeModal;

// ── Setup all modal close-on-overlay-click ─
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  });
  document.querySelectorAll(".modal-close").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest(".modal-overlay")?.classList.remove("open");
    });
  });
  populateNavUser();
});