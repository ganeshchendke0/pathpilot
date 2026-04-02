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
  const name            = document.getElementById("r-name").value.trim();
  const email           = document.getElementById("r-email").value.trim();
  const phone           = document.getElementById("r-phone").value.trim();
  const location        = document.getElementById("r-location").value.trim();
  const summary         = document.getElementById("r-summary").value.trim();
  const education       = document.getElementById("r-education").value.trim();
  const experience      = document.getElementById("r-experience").value.trim();
  const skills          = document.getElementById("r-skills").value.trim();
  const projects        = document.getElementById("r-projects").value.trim();
  const certifications  = document.getElementById("r-certifications").value.trim();
  const languages       = document.getElementById("r-languages").value.trim();
  const objective       = document.getElementById("r-objective").value.trim();

  if (!name || !email || !skills || !objective) {
    showToast("Please fill Name, Email, Skills, and Career Objective", "warning");
    return;
  }

  const output = document.getElementById("resume-output");
  output.innerHTML = `<p class="text-muted">✨ Generating your professional resume...</p>`;

  try {
    const resumeData = {
      name, email, phone, location, summary, education,
      experience, skills, projects, certifications, languages, objective
    };

    const res = await fetch(`${BASE_URL}/ai/resume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("pp_token")}`
      },
      body: JSON.stringify(resumeData)
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
    
    // Store resume data for PDF generation
    window.currentResumeData = resumeData;
    
    output.innerHTML = `
      <div class="resume-output">
        <div class="resume-header">
          <span>✅ Your Professional Resume</span>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-ghost btn-sm" onclick="copyResume()">📋 Copy</button>
            <button class="btn btn-primary btn-sm" onclick="downloadResumeAsPDF()">📥 Download PDF</button>
          </div>
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

async function downloadResumeAsPDF() {
  if (!window.currentResumeData) {
    showToast("Please generate resume first", "warning");
    return;
  }

  try {
    showToast("📥 Generating PDF...", "info");
    console.log("Downloading PDF for:", window.currentResumeData.name);
    
    const res = await fetch(`${BASE_URL}/ai/resume/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("pp_token")}`
      },
      body: JSON.stringify(window.currentResumeData)
    });

    console.log("Response status:", res.status);
    console.log("Response type:", res.type);
    console.log("Content-Type:", res.headers.get('content-type'));

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error response:", errorText);
      try {
        const errorData = JSON.parse(errorText);
        showToast(`❌ Error: ${errorData.error || 'Failed to generate PDF'}`, "error");
      } catch {
        showToast(`❌ Server error (${res.status})`, "error");
      }
      return;
    }

    // Get the blob
    const blob = await res.blob();
    console.log("Blob size:", blob.size, "bytes");
    
    if (blob.size === 0) {
      showToast("❌ PDF is empty", "error");
      return;
    }

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${window.currentResumeData.name.replace(/\s+/g, "_")}_resume.pdf`;
    
    console.log("Downloading as:", link.download);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
    
    showToast("✅ Resume downloaded successfully!", "success");
  } catch (err) {
    console.error("PDF download error:", err);
    showToast(`❌ Error: ${err.message}`, "error");
  }
}