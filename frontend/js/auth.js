// ═══════════════════════════════════════════
//  PathPilot v2 — Auth Page Logic
// ═══════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  // Tab switching
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      document.getElementById("login-form").style.display    = tab === "login"    ? "flex" : "none";
      document.getElementById("register-form").style.display = tab === "register" ? "flex" : "none";
    });
  });

  // Login
  document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn   = e.target.querySelector("button[type=submit]");
    const email = document.getElementById("l-email").value.trim();
    const pw    = document.getElementById("l-pw").value;
    btn.disabled = true;
    btn.textContent = "Signing in…";
    try {
      const data = await Auth.login(email, pw);
      Auth.saveSession(data.token, data.user);
      showToast("Welcome back! 🎉", "success");
      setTimeout(() => location.href = "dashboard.html", 600);
    } catch (err) {
      showToast(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Sign In →";
    }
  });

  // Register
  document.getElementById("register-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn  = e.target.querySelector("button[type=submit]");
    const name = document.getElementById("r-name").value.trim();
    const email= document.getElementById("r-email").value.trim();
    const pw   = document.getElementById("r-pw").value;
    if (pw.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    btn.disabled = true;
    btn.textContent = "Creating account…";
    try {
      const data = await Auth.register(name, email, pw);
      Auth.saveSession(data.token, data.user);
      showToast("Account created! Welcome 🚀", "success");
      setTimeout(() => location.href = "dashboard.html", 600);
    } catch (err) {
      showToast(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Create Account →";
    }
  });
});
