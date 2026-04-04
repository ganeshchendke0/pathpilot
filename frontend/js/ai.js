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

function normalizeResumeList(value, splitPattern = /[\r\n,;]+/) {
  const source = String(value || "").trim();
  if (!source) return [];
  return source
    .split(splitPattern)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeResumeLines(value) {
  return normalizeResumeList(value, /[\r\n;]+/);
}

function extractSummary(summary, resumeText, objective) {
  if (summary) return summary;

  const match = String(resumeText || "").match(/summary:\s*([\s\S]*?)(?:\n[A-Z][A-Za-z ]+:|$)/i);
  if (match?.[1]) {
    return match[1].replace(/\s+/g, " ").trim();
  }

  return objective || "A motivated professional with strong communication, analytical thinking, and a focus on delivering meaningful results.";
}

function splitTitleAndOrganization(value) {
  const parts = String(value || "")
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      title: parts[0],
      organization: parts.slice(1).join(", ")
    };
  }

  return {
    title: String(value || "").trim(),
    organization: ""
  };
}

function parseResumeEntry(item, type) {
  const raw = String(item || "").trim();
  if (!raw) return null;

  const parts = raw
    .split("|")
    .map(part => part.trim())
    .filter(Boolean);

  let meta = "";
  let title = "";
  let description = "";

  if (type === "experience") {
    if (parts.length >= 4) {
      meta = `${parts[0]} | ${parts[1]}`;
      title = parts[2];
      description = parts.slice(3).join(" | ");
    } else if (parts.length === 3) {
      meta = `${parts[0]} | ${parts[1]}`;
      title = parts[2];
    } else if (parts.length === 2) {
      const parsed = splitTitleAndOrganization(parts[0]);
      meta = parsed.organization ? `${parsed.organization} | ${parts[1]}` : `${parts[0]} | ${parts[1]}`;
      title = parsed.organization ? parsed.title : "";
    }
  } else if (type === "education") {
    if (parts.length >= 4) {
      meta = `${parts[0]} | ${parts[1]}`;
      title = parts[2];
      description = parts.slice(3).join(" | ");
    } else if (parts.length === 3) {
      meta = `${parts[0]} | ${parts[1]}`;
      title = parts[2];
    } else if (parts.length === 2) {
      const parsed = splitTitleAndOrganization(parts[0]);
      meta = parsed.organization ? `${parsed.organization} | ${parts[1]}` : `${parts[0]} | ${parts[1]}`;
      title = parsed.organization ? parsed.title : "";
    }
  }

  return { raw, meta, title, description };
}

function renderResumeSection(title, content) {
  return `
    <section class="resume-template-section">
      <div class="resume-template-section-head">
        <h2 class="resume-template-section-title">${title}</h2>
        <div class="resume-template-divider"></div>
      </div>
      ${content}
    </section>`;
}

function renderResumeEntries(items, type, emptyText) {
  if (!items.length) {
    return `<p class="resume-template-empty">${esc(emptyText)}</p>`;
  }

  return items.map(item => {
    const entry = parseResumeEntry(item, type);

    if (!entry) {
      return "";
    }

    const hasStructuredContent = entry.meta || entry.title || entry.description;

    return `
      <article class="resume-template-entry">
        ${entry.meta ? `<div class="resume-template-meta">${esc(entry.meta)}</div>` : ""}
        ${entry.title ? `<div class="resume-template-entry-title">${esc(entry.title)}</div>` : ""}
        ${entry.description ? `<p class="resume-template-entry-text">${esc(entry.description)}</p>` : ""}
        ${hasStructuredContent ? "" : `<p class="resume-template-entry-text">${esc(entry.raw)}</p>`}
      </article>`;
  }).join("");
}

function renderResumeList(items, emptyText) {
  if (!items.length) {
    return `<p class="resume-template-empty">${esc(emptyText)}</p>`;
  }

  return `
    <ul class="resume-template-list">
      ${items.map(item => `<li>${esc(item)}</li>`).join("")}
    </ul>`;
}

function renderSkillsGrid(skills) {
  if (!skills.length) {
    return `<p class="resume-template-empty">List your top professional skills.</p>`;
  }

  const columns = [[], [], []];
  skills.forEach((skill, index) => {
    columns[index % columns.length].push(skill);
  });

  return `
    <div class="resume-template-skills-grid">
      ${columns.map(column => `
        <ul class="resume-template-skill-column">
          ${column.map(skill => `<li>${esc(skill)}</li>`).join("")}
        </ul>
      `).join("")}
    </div>`;
}

function renderResumeTemplate(data, resumeText) {
  const summary = extractSummary(data.summary, resumeText, data.objective);
  const education = normalizeResumeLines(data.education);
  const experience = normalizeResumeLines(data.experience);
  const skills = normalizeResumeList(data.skills);
  const projects = normalizeResumeLines(data.projects);
  const certifications = normalizeResumeLines(data.certifications);
  const languages = normalizeResumeList(data.languages);

  const contactItems = [
    data.phone ? { icon: "&#9742;", text: data.phone } : null,
    data.email ? { icon: "&#9993;", text: data.email } : null,
    data.location ? { icon: "&#128205;", text: data.location } : null
  ].filter(Boolean);

  const optionalSections = [
    projects.length ? renderResumeSection("Projects", renderResumeList(projects, "Add key projects or accomplishments.")) : "",
    certifications.length ? renderResumeSection("Certifications", renderResumeList(certifications, "Optional certifications go here.")) : "",
    languages.length ? renderResumeSection("Languages", renderResumeList(languages, "Include languages you know.")) : ""
  ].join("");

  return `
    <div class="resume-template">
      <div class="resume-template-page">
        <header class="resume-template-header">
          <h1 class="resume-template-name">${esc(data.name)}</h1>
          <div class="resume-template-role">${esc(data.objective)}</div>
          ${contactItems.length ? `
            <div class="resume-template-contact">
              ${contactItems.map(item => `
                <div class="resume-template-contact-item">
                  <span class="resume-template-contact-icon">${item.icon}</span>
                  <span>${esc(item.text)}</span>
                </div>
              `).join("")}
            </div>
          ` : ""}
        </header>

        ${renderResumeSection("About Me", `<p class="resume-template-text">${esc(summary)}</p>`)}
        ${renderResumeSection("Education", renderResumeEntries(education, "education", "Add your education details above."))}
        ${renderResumeSection("Work Experience", renderResumeEntries(experience, "experience", "Add your experience details above."))}
        ${optionalSections}
        ${renderResumeSection("Skills", renderSkillsGrid(skills))}

        <div class="resume-template-footer-bar"></div>
      </div>
    </div>`;
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

    window.currentResumeData = resumeData;
    const resumeText = data.resume || data.response || summary;
    output.innerHTML = `
      <div class="resume-output-shell">
        <div class="resume-output-toolbar">
          <span>✅ Your Professional Resume</span>
          <div class="resume-output-actions">
            <button class="btn btn-ghost btn-sm" onclick="copyResume()">📋 Copy</button>
            <button class="btn btn-primary btn-sm" onclick="downloadResumeAsPDF()">📥 Download PDF</button>
          </div>
        </div>
        ${renderResumeTemplate(resumeData, resumeText)}
      </div>`;
  } catch (err) {
    output.innerHTML = `<p style="color:var(--rose)">❌ Network error. Please try again.</p>`;
    console.error("Resume generation error:", err);
  }
}

function copyResume() {
  const container = document.getElementById("resume-output");
  const text = container?.innerText;
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
