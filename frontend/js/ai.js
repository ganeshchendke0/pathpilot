// ═══════════════════════════════════════════
//  PathPilot — AI Assistant
// ═══════════════════════════════════════════

const BASE_URL = "http://127.0.0.1:5000/api";

function formatAiFallbackMessage(status) {
  if (!status || status.source !== "fallback") return "";

  const retryHint = status.retry_after ? ` Try again in about ${status.retry_after} seconds.` : "";

  switch (status.reason) {
    case "quota_exceeded":
      return `AI quota is currently exhausted, so this response is using PathPilot's built-in fallback guidance.${retryHint}`;
    case "temporarily_unavailable":
      return `Gemini is under heavy load right now, so this response is using fallback guidance.${retryHint}`;
    case "cooldown_active":
      return `AI requests are cooling down after a recent limit hit, so fallback guidance is being used.${retryHint}`;
    case "gemini_disabled":
      return "Gemini is not configured, so fallback guidance is being used.";
    default:
      return `AI is temporarily unavailable, so this response is using fallback guidance.${retryHint}`;
  }
}

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
    const fallbackNotice = formatAiFallbackMessage(data.ai_status);
    if (fallbackNotice) {
      appendMessage("bot", `Note: ${fallbackNotice}`);
    }
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

function splitDetailItems(value) {
  return String(value || "")
    .split(/(?:\s*[;•]\s*|\r?\n)+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function looksLikeDate(value) {
  return /(present|current|\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(String(value || ""));
}

function parseResumeEntry(item) {
  const raw = String(item || "").trim();
  if (!raw) return null;

  const parts = raw
    .split("|")
    .map(part => part.trim())
    .filter(Boolean);

  let title = "";
  let meta = "";
  let bullets = [];

  if (parts.length === 1) {
    title = parts[0];
  } else if (parts.length === 2) {
    title = parts[0];
    if (looksLikeDate(parts[1])) {
      meta = parts[1];
    } else {
      bullets = splitDetailItems(parts[1]);
    }
  } else {
    title = parts[0];
    meta = parts[1];
    bullets = splitDetailItems(parts.slice(2).join(";"));
  }

  return { raw, meta, title, bullets };
}

function parseSkillGroups(value) {
  const lines = normalizeResumeLines(value);
  if (!lines.length) return [];

  return lines.map(line => {
    const parts = line.split(/[:|]/).map(part => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return {
        label: parts[0],
        values: normalizeResumeList(parts.slice(1).join(", "))
      };
    }

    return {
      label: "",
      values: normalizeResumeList(line)
    };
  }).filter(group => group.label || group.values.length);
}

function formatUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^(mailto:|tel:|https?:\/\/)/i.test(text)) return text;
  if (text.includes("@")) return `mailto:${text}`;
  if (/^[+\d\s()-]+$/.test(text)) return `tel:${text.replace(/\s+/g, "")}`;
  return `https://${text.replace(/^\/+/, "")}`;
}

function renderContactItem(item) {
  if (!item?.text) return "";

  if (!item.href) {
    return `<div class="resume-template-contact-item resume-template-contact-item--plain">${esc(item.text)}</div>`;
  }

  return `
    <div class="resume-template-contact-item">
      <a href="${esc(item.href)}" target="_blank" rel="noopener noreferrer">${esc(item.text)}</a>
    </div>`;
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

function renderResumeEntries(items, emptyText) {
  if (!items.length) {
    return `<p class="resume-template-empty">${esc(emptyText)}</p>`;
  }

  return items.map(item => {
    const entry = parseResumeEntry(item);

    if (!entry) {
      return "";
    }

    return `
      <article class="resume-template-entry">
        <div class="resume-template-entry-head">
          <h3 class="resume-template-entry-title">${esc(entry.title || entry.raw)}</h3>
          ${entry.meta ? `<div class="resume-template-meta">${esc(entry.meta)}</div>` : ""}
        </div>
        ${entry.bullets.length ? `
          <ul class="resume-template-list">
            ${entry.bullets.map(detail => `<li>${esc(detail)}</li>`).join("")}
          </ul>
        ` : ""}
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

function renderSkillsList(skillGroups) {
  if (!skillGroups.length) {
    return `<p class="resume-template-empty">List your top professional skills.</p>`;
  }

  return `
    <ul class="resume-template-skills-list">
      ${skillGroups.map(group => `
        <li>
          ${group.label ? `<span class="resume-template-skill-label">${esc(group.label)}:</span> ` : ""}
          ${esc(group.values.join(", "))}
        </li>
      `).join("")}
    </ul>`;
}

function renderResumeTemplate(data, resumeText) {
  const summary = extractSummary(data.summary, resumeText, data.objective);
  const education = normalizeResumeLines(data.education);
  const experience = normalizeResumeLines(data.experience);
  const skills = parseSkillGroups(data.skills);
  const projects = normalizeResumeLines(data.projects);
  const certifications = normalizeResumeLines(data.certifications);
  const languages = normalizeResumeList(data.languages);

  const contactItems = [
    data.phone ? { text: data.phone, href: formatUrl(data.phone) } : null,
    data.email ? { text: data.email, href: formatUrl(data.email) } : null
  ].filter(Boolean);

  const sections = [
    renderResumeSection("Summary", `<p class="resume-template-text">${esc(summary)}</p>`),
    renderResumeSection("Education", renderResumeEntries(education, "Add your education details above.")),
    experience.length ? renderResumeSection("Experience", renderResumeEntries(experience, "Add your experience details above.")) : "",
    projects.length ? renderResumeSection("Projects", renderResumeEntries(projects, "Add key projects or accomplishments.")) : "",
    renderResumeSection("Skills", renderSkillsList(skills)),
    certifications.length ? renderResumeSection("Certificates", renderResumeEntries(certifications, "Optional certificates go here.")) : "",
    languages.length ? renderResumeSection("Languages", renderResumeList(languages, "Include languages you know.")) : ""
  ].join("");

  return `
    <div class="resume-template">
      <div class="resume-template-page">
        <header class="resume-template-header">
          <div class="resume-template-head-main">
            <div>
              <h1 class="resume-template-name">${esc(data.name)}</h1>
              ${data.location ? `<p class="resume-template-location">${esc(data.location)}</p>` : ""}
            </div>
            ${contactItems.length ? `
              <div class="resume-template-contact">
                ${contactItems.map(renderContactItem).join("")}
              </div>
            ` : ""}
          </div>
        </header>

        ${sections}
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

  if (!name || !email || !skills) {
    showToast("Please fill Name, Email, and Skills", "warning");
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
    const fallbackNotice = formatAiFallbackMessage(data.ai_status);
    output.innerHTML = `
      <div class="resume-output-shell">
        <div class="resume-output-toolbar">
          <span>✅ Your Professional Resume</span>
          <div class="resume-output-actions">
            <button class="btn btn-ghost btn-sm" onclick="copyResume()">📋 Copy</button>
            <button class="btn btn-primary btn-sm" onclick="downloadResumeAsPDF()">📥 Download PDF</button>
          </div>
        </div>
        ${fallbackNotice ? `<p class="text-muted">${esc(fallbackNotice)}</p>` : ""}
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
