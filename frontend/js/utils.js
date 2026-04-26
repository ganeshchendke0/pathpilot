function showToast(message, type = "info", duration = 3500) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = Object.assign(document.createElement("div"), { className: "toast-container" });
    document.body.appendChild(container);
  }

  const icons = {
    success: "OK",
    error: "!",
    info: "i",
    warning: "!"
  };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${icons[type] || "i"}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "all 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
window.showToast = showToast;

function esc(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
window.esc = esc;

function fmtDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
window.fmtDate = fmtDate;

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
window.timeAgo = timeAgo;

function requireAuth() {
  if (!Auth.isLoggedIn()) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}
window.requireAuth = requireAuth;

function populateNavUser() {
  const user = Auth.currentUser();
  if (!user) return;

  const nameEl = document.getElementById("nav-user-name");
  if (nameEl) nameEl.textContent = user.name?.split(" ")[0] || "Student";

  const xpEl = document.getElementById("nav-xp");
  if (xpEl && user.xp_points !== undefined) xpEl.textContent = `${user.xp_points} XP`;
}
window.populateNavUser = populateNavUser;

function statusBadge(status) {
  const map = {
    completed: ["badge-emerald", "Completed"],
    in_progress: ["badge-cyan", "In Progress"],
    not_started: ["badge-amber", "Not Started"],
  };
  const [cls, label] = map[status] || ["badge-indigo", status || "Unknown"];
  return `<span class="badge ${cls}">${label}</span>`;
}
window.statusBadge = statusBadge;

function priorityBadge(priority) {
  const map = {
    high: ["badge-rose", "High"],
    medium: ["badge-amber", "Medium"],
    low: ["badge-emerald", "Low"],
  };
  const [cls, label] = map[priority] || ["badge-indigo", priority || "Normal"];
  return `<span class="badge ${cls}">${label}</span>`;
}
window.priorityBadge = priorityBadge;

function getLoadingMarkup(message = "Loading...") {
  return `
    <div class="loading-state" role="status" aria-live="polite">
      <div class="loading-spinner" aria-hidden="true"></div>
      <div class="loading-label">${esc(message)}</div>
    </div>`;
}
window.getLoadingMarkup = getLoadingMarkup;

function getEmptyMarkup(title = "Nothing here yet", description = "") {
  return `
    <div class="empty-state">
      <div class="empty-title">${esc(title)}</div>
      ${description ? `<p class="empty-sub">${esc(description)}</p>` : ""}
    </div>`;
}
window.getEmptyMarkup = getEmptyMarkup;

function getErrorMarkup(message = "Something went wrong. Please try again.") {
  return `
    <div class="empty-state">
      <div class="empty-title">Unable to load</div>
      <p class="empty-sub">${esc(message)}</p>
    </div>`;
}
window.getErrorMarkup = getErrorMarkup;

function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove("open");

  if (!document.querySelector(".modal-overlay.open")) {
    document.body.style.overflow = "";
  }
}

window.openModal = openModal;
window.closeModal = closeModal;

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        overlay.classList.remove("open");
        if (!document.querySelector(".modal-overlay.open")) {
          document.body.style.overflow = "";
        }
      }
    });
  });

  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".modal-overlay")?.classList.remove("open");
      if (!document.querySelector(".modal-overlay.open")) {
        document.body.style.overflow = "";
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const topModal = Array.from(document.querySelectorAll(".modal-overlay.open")).pop();
    if (!topModal) return;
    topModal.classList.remove("open");
    if (!document.querySelector(".modal-overlay.open")) {
      document.body.style.overflow = "";
    }
  });

  populateNavUser();
});
