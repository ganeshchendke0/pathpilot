// ═══════════════════════════════════════════
//  PathPilot — AI Assistant
// ═══════════════════════════════════════════

const BASE_URL = "http://127.0.0.1:5000/api";

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return;
  document.getElementById("logout-btn")?.addEventListener("click", () => Auth.logout());
  document.getElementById("chat-input")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const question = input.value.trim();
  if (!question) return;

  appendMessage("user", question);
  input.value = "";
  appendMessage("bot", "⏳ Thinking...", "thinking");

  try {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    removeThinking();
    appendMessage("bot", data.answer || data.error);
  } catch (err) {
    removeThinking();
    appendMessage("bot", "❌ Could not connect to AI. Try again.");
  }
}

function quickAsk(question) {
  document.getElementById("chat-input").value = question;
  sendMessage();
}

function appendMessage(role, text, id = "") {
  const box = document.getElementById("chat-messages");
  const div = document.createElement("div");
  if (id) div.id = id;
  div.style.cssText = `
    padding:12px 16px;border-radius:12px;max-width:85%;
    line-height:1.6;font-size:0.95rem;
    ${role === "user"
      ? "background:var(--indigo);color:#fff;align-self:flex-end;margin-left:auto;"
      : "background:var(--surface-2);color:var(--text-1);align-self:flex-start;"}
  `;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function removeThinking() {
  document.getElementById("thinking")?.remove();
}

async function buildResume() {
  const name      = document.getElementById("r-name").value.trim();
  const email     = document.getElementById("r-email").value.trim();
  const education = document.getElementById("r-education").value.trim();
  const skills    = document.getElementById("r-skills").value.trim().split(",").map(s => s.trim());
  const goal      = document.getElementById("r-goal").value.trim();
  const projects  = document.getElementById("r-projects").value.trim();

  if (!name || !email || !goal) {
    alert("Please fill Name, Email and Career Goal");
    return;
  }

  const output = document.getElementById("resume-output");
  output.innerHTML = `<p class="text-muted">✨ Generating your resume...</p>`;

  try {
    const res = await fetch(`${BASE_URL}/ai/resume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ name, email, education, skills, career_goal: goal, projects })
    });
    const data = await res.json();
    output.innerHTML = `
      <div style="background:var(--surface-2);border-radius:12px;padding:20px;margin-top:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-weight:700">✅ Your Resume</span>
          <button class="btn btn-ghost btn-sm" onclick="copyResume()">📋 Copy</button>
        </div>
        <pre id="resume-text" style="white-space:pre-wrap;font-family:monospace;font-size:0.85rem;line-height:1.7">${data.resume}</pre>
      </div>`;
  } catch (err) {
    output.innerHTML = `<p style="color:red">❌ Failed to generate resume. Try again.</p>`;
  }
}

function copyResume() {
  const text = document.getElementById("resume-text")?.textContent;
  if (text) {
    navigator.clipboard.writeText(text);
    alert("📋 Resume copied to clipboard!");
  }
}