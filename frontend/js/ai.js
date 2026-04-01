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
        "Authorization": `Bearer ${localStorage.getItem("pp_token")}`
      },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    removeThinking();
    
    // Handle authentication errors
    if (res.status === 401) {
      showToast("Your session expired. Please sign in again.", "error");
      Auth.logout();
      return;
    }
    if (res.status === 403) {
      showToast("Access denied. Please sign in again.", "error");
      Auth.logout();
      return;
    }
    if (!res.ok) {
      appendMessage("bot", `❌ Error: ${data.error || "Unable to process request"}`);
      return;
    }
    
    appendMessage("bot", data.answer || data.response || "No response from AI");
  } catch (err) {
    removeThinking();
    appendMessage("bot", "❌ Network error. Please check your connection and try again.");
    console.error("Chat error:", err);
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
  div.className = `chat-message ${role === "user" ? "user" : "bot"}${id === "thinking" ? " chat-thinking" : ""}`;
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
    showToast("Please fill Name, Email and Career Goal", "warning");
    return;
  }

  const output = document.getElementById("resume-output");
  output.innerHTML = `<p class="text-muted">✨ Generating your resume...</p>`;

  try {
    const res = await fetch(`${BASE_URL}/ai/resume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("pp_token")}`
      },
      body: JSON.stringify({ name, email, education, skills, career_goal: goal, projects })
    });
    const data = await res.json();
    
    // Handle authentication errors
    if (res.status === 401) {
      showToast("Your session expired. Please sign in again.", "error");
      Auth.logout();
      return;
    }
    if (res.status === 403) {
      showToast("Access denied. Please sign in again.", "error");
      Auth.logout();
      return;
    }
    if (!res.ok) {
      output.innerHTML = `<p style="color:var(--rose)">❌ Error: ${data.error || "Unable to generate resume"}</p>`;
      return;
    }
    
    output.innerHTML = `
      <div class="resume-output">
        <div class="resume-header">
          <span>✅ Your Professional Resume</span>
          <button class="btn btn-ghost btn-sm" onclick="copyResume()">📋 Copy</button>
        </div>
        <div id="resume-text">${data.resume || data.response}</div>
      </div>`;
  } catch (err) {
    output.innerHTML = `<p style="color:var(--rose)">❌ Network error. Please try again.</p>`;
    console.error("Resume generation error:", err);
  }
}

function copyResume() {
  const text = document.getElementById("resume-text")?.textContent;
  if (text) {
    navigator.clipboard.writeText(text);
    showToast("📋 Resume copied to clipboard!", "success");
  }
}