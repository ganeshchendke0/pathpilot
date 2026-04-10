import os
import json
import io
import re
import time
from datetime import datetime
from config.db import query
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from xml.sax.saxutils import escape

# Load env
load_dotenv()

# Gemini SDK state
GEMINI_ENABLED = False
GEMINI_CLIENT = None
GEMINI_LEGACY = None
GEMINI_ACTIVE_MODEL = None
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_LAST_STATUS = {"source": "fallback", "reason": "uninitialized", "retry_after": None, "model": None}
GEMINI_MODEL_CANDIDATES = [
    model_name.strip()
    for model_name in (
        os.getenv("GEMINI_MODEL_CANDIDATES")
        or os.getenv("GEMINI_MODEL")
        or "gemini-2.5-flash,gemini-2.0-flash"
    ).split(",")
    if model_name.strip()
]
GEMINI_MODEL_BACKOFF_UNTIL = {}
GEMINI_DEFAULT_BACKOFF_SECONDS = int(os.getenv("GEMINI_DEFAULT_BACKOFF_SECONDS", "60"))


def _set_last_status(source, reason=None, retry_after=None, model=None):
    """Store the latest AI execution status for API consumers."""
    global GEMINI_LAST_STATUS
    GEMINI_LAST_STATUS = {
        "source": source,
        "reason": reason,
        "retry_after": retry_after,
        "model": model,
    }


def get_last_ai_status():
    """Return the latest AI generation status."""
    return dict(GEMINI_LAST_STATUS)


def _extract_retry_after_seconds(error):
    """Best-effort extraction of retry delay from Gemini error messages."""
    text = str(error)
    match = re.search(r"retry in ([0-9]+(?:\.[0-9]+)?)s", text, re.IGNORECASE)
    if match:
        return max(1, int(float(match.group(1))))

    match = re.search(r"'retryDelay': '([0-9]+)s'", text)
    if match:
        return max(1, int(match.group(1)))

    return None


def _classify_gemini_error(error):
    """Classify Gemini failures so the app can degrade gracefully."""
    text = str(error).upper()
    if "RESOURCE_EXHAUSTED" in text or "QUOTA EXCEEDED" in text or "429" in text:
        return "quota_exceeded"
    if "UNAVAILABLE" in text or "503" in text or "HIGH DEMAND" in text:
        return "temporarily_unavailable"
    if "DEADLINE_EXCEEDED" in text or "TIMED OUT" in text or "TIMEOUT" in text:
        return "timeout"
    return "generation_failed"


def _get_model_backoff_remaining(model_name):
    """Return remaining backoff seconds for a model, if any."""
    until_ts = GEMINI_MODEL_BACKOFF_UNTIL.get(model_name)
    if not until_ts:
        return 0
    remaining = int(until_ts - time.time())
    return max(0, remaining)


def _put_model_on_backoff(model_name, error):
    """Temporarily stop calling a model after quota or availability failures."""
    retry_after = _extract_retry_after_seconds(error) or GEMINI_DEFAULT_BACKOFF_SECONDS
    GEMINI_MODEL_BACKOFF_UNTIL[model_name] = time.time() + retry_after
    return retry_after


def _init_gemini():
    """Initialize the best available Gemini SDK for the current environment."""
    global GEMINI_ENABLED, GEMINI_CLIENT, GEMINI_LEGACY

    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY not set in environment")
        return

    try:
        from google import genai

        GEMINI_CLIENT = genai.Client(api_key=GEMINI_API_KEY)
        GEMINI_ENABLED = True
        print("Gemini SDK initialized with google.genai")
        return
    except ImportError:
        pass
    except Exception as e:
        print(f"Gemini google.genai initialization failed: {e}")

    try:
        import google.generativeai as legacy_genai

        legacy_genai.configure(api_key=GEMINI_API_KEY)
        GEMINI_LEGACY = legacy_genai
        GEMINI_ENABLED = True
        print("Gemini SDK initialized with legacy google.generativeai")
    except ImportError:
        print("No Gemini SDK installed. Install google-genai.")
    except Exception as e:
        print(f"Gemini API not available: {e}")


def _extract_response_text(response):
    """Extract text from either the new or legacy Gemini SDK response objects."""
    text = getattr(response, "text", None)
    if text:
        return text

    if hasattr(response, "candidates"):
        parts = []
        for candidate in getattr(response, "candidates", []) or []:
            content = getattr(candidate, "content", None)
            for part in getattr(content, "parts", []) or []:
                value = getattr(part, "text", None)
                if value:
                    parts.append(value)
        if parts:
            return "\n".join(parts)

    return None


def _generate_with_new_sdk(prompt):
    """Generate content with the current google.genai client."""
    global GEMINI_ACTIVE_MODEL

    last_error = None
    last_reason = "generation_failed"
    last_retry_after = None
    candidates = []

    if GEMINI_ACTIVE_MODEL:
        candidates.append(GEMINI_ACTIVE_MODEL)
    candidates.extend([m for m in GEMINI_MODEL_CANDIDATES if m != GEMINI_ACTIVE_MODEL])

    for model_name in candidates:
        remaining = _get_model_backoff_remaining(model_name)
        if remaining > 0:
            last_error = RuntimeError(f"Model {model_name} is cooling down. Retry in {remaining}s.")
            last_reason = "cooldown_active"
            last_retry_after = remaining
            continue
        try:
            response = GEMINI_CLIENT.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            text = _extract_response_text(response)
            if text:
                if GEMINI_ACTIVE_MODEL != model_name:
                    GEMINI_ACTIVE_MODEL = model_name
                    print(f"Gemini model selected: {model_name}")
                _set_last_status("gemini", "ok", None, model_name)
                return text
        except Exception as e:
            last_error = e
            last_reason = _classify_gemini_error(e)
            last_retry_after = _put_model_on_backoff(model_name, e)
            print(f"Gemini model '{model_name}' failed: {e}")

    if last_error:
        _set_last_status("fallback", last_reason, last_retry_after, None)
        raise last_error

    _set_last_status("fallback", "no_models_configured", None, None)
    raise RuntimeError("No Gemini models are configured.")


def _generate_with_legacy_sdk(prompt):
    """Generate content with the deprecated google.generativeai SDK."""
    global GEMINI_ACTIVE_MODEL

    last_error = None
    last_reason = "generation_failed"
    last_retry_after = None
    candidates = []

    if GEMINI_ACTIVE_MODEL:
        candidates.append(GEMINI_ACTIVE_MODEL)
    candidates.extend([m for m in GEMINI_MODEL_CANDIDATES if m != GEMINI_ACTIVE_MODEL])

    for model_name in candidates:
        remaining = _get_model_backoff_remaining(model_name)
        if remaining > 0:
            last_error = RuntimeError(f"Model {model_name} is cooling down. Retry in {remaining}s.")
            last_reason = "cooldown_active"
            last_retry_after = remaining
            continue
        try:
            model = GEMINI_LEGACY.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            text = _extract_response_text(response)
            if text:
                if GEMINI_ACTIVE_MODEL != model_name:
                    GEMINI_ACTIVE_MODEL = model_name
                    print(f"Gemini model selected: {model_name}")
                _set_last_status("gemini", "ok", None, model_name)
                return text
        except Exception as e:
            last_error = e
            last_reason = _classify_gemini_error(e)
            last_retry_after = _put_model_on_backoff(model_name, e)
            print(f"Gemini model '{model_name}' failed: {e}")

    if last_error:
        _set_last_status("fallback", last_reason, last_retry_after, None)
        raise last_error

    _set_last_status("fallback", "no_models_configured", None, None)
    raise RuntimeError("No Gemini models are configured.")


_init_gemini()


def safe_generate(prompt):
    """Generate content using Gemini with fallback."""
    try:
        if not GEMINI_ENABLED:
            _set_last_status("fallback", "gemini_disabled", None, None)
            return fallback_response(prompt)

        if GEMINI_CLIENT is not None:
            return _generate_with_new_sdk(prompt)

        if GEMINI_LEGACY is not None:
            return _generate_with_legacy_sdk(prompt)

        _set_last_status("fallback", "gemini_client_unavailable", None, None)
        return fallback_response(prompt)

    except Exception as e:
        print(f"Gemini error: {e}")
        if GEMINI_LAST_STATUS.get("source") != "fallback":
            _set_last_status("fallback", _classify_gemini_error(e), _extract_retry_after_seconds(e), None)
        return fallback_response(prompt)


def fallback_response(prompt):
    """Fallback responses when Gemini unavailable"""
    prompt_lower = prompt.lower()

    # ✅ Resume Generator
    if "resume" in prompt_lower:
        return """Name: Student
Email: student@email.com
Phone: +91-9876543210
Location: Bangalore, India

Objective:
To launch a career in software development by building strong technical foundations and working on real-world projects.

Summary:
Motivated and detail-oriented professional with experience in developing web applications and delivering customer-focused solutions.

Education:
Bachelor's Degree in Computer Science

Experience:
Software Developer Intern, Example Corp | 2023 - Present

Skills:
Python, JavaScript, HTML, CSS, React

Projects:
Developed a career guidance web app that helps students discover growth paths.

Certifications:
Certified Web Developer

Languages:
English, Hindi
"""

    # ✅ Career Chat
    elif "career" in prompt_lower:
        return "To become a Full Stack Developer, start with HTML, CSS, and JavaScript. Then learn backend technologies like Python or Node.js, build real projects, and practice consistently."

    # ✅ Weekly Report
    elif "weekly" in prompt_lower or "report" in prompt_lower:
        return "Great progress this week! You stayed consistent with your goals and learning. Keep improving your skills daily, take breaks when needed, and stay focused."

    # ✅ Roadmap
    elif "roadmap" in prompt_lower:
        return json.dumps([
            {"week_number": 1, "title": "Week 1: Basics", "description": "Learn fundamentals", "resources": ["YouTube", "Docs"]},
            {"week_number": 2, "title": "Week 2: Practice", "description": "Build projects", "resources": ["GitHub"]},
            {"week_number": 3, "title": "Week 3: Advanced", "description": "Learn advanced topics", "resources": ["Courses"]}
        ])

    return "AI is currently unavailable. Please try again later."


# ✅ 1. Career Chat
def ask_career_question(question, context=""):
    """Ask AI a career question"""
    prompt = f"""You are PathPilot AI — a friendly career advisor for Indian students.
Answer this question helpfully and concisely:

Question: {question}
Context: {context if context else 'General career advice'}

Provide actionable and practical advice."""
    return safe_generate(prompt)


# ✅ 2. Resume Generator
def generate_resume(data):
    """Generate resume text using AI"""
    prompt = f"""Generate a professional resume using the information below.
Include the following sections: PROFILE, EDUCATION, EXPERIENCE, SKILLS, PROJECTS, CERTIFICATIONS, LANGUAGES.
Use a clean, modern resume style.

Name: {data.get('name')}
Email: {data.get('email')}
Phone: {data.get('phone')}
Location: {data.get('location')}
Objective: {data.get('objective')}
Summary: {data.get('summary')}
Education: {data.get('education')}
Experience: {data.get('experience')}
Skills: {data.get('skills')}
Projects: {data.get('projects')}
Certifications: {data.get('certifications')}
Languages: {data.get('languages')}

Keep the format readable and suitable for a one-page resume."""
    return safe_generate(prompt)


def _get_pdf_styles(styles):
    """Helper function to create and return all PDF paragraph styles"""
    sidebar_heading = ParagraphStyle(
        'SidebarHeading',
        parent=styles['Heading2'],
        fontSize=10.5,
        textColor=colors.HexColor('#ffffff'),
        fontName='Helvetica-Bold',
        spaceAfter=8,
        spaceBefore=6
    )
    sidebar_text = ParagraphStyle(
        'SidebarText',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#e5e7eb'),
        leading=11,
        spaceAfter=4
    )
    main_name = ParagraphStyle(
        'MainName',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#1f2937'),
        fontName='Helvetica-Bold',
        spaceAfter=0
    )
    main_title = ParagraphStyle(
        'MainTitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#6b7280'),
        spaceAfter=8,
        fontName='Helvetica'
    )
    section_heading = ParagraphStyle(
        'SectionHead',
        parent=styles['Heading2'],
        fontSize=10,
        textColor=colors.HexColor('#1f2937'),
        fontName='Helvetica-Bold',
        spaceAfter=6,
        spaceBefore=4,
        borderBottomColor=colors.HexColor('#4f46e5'),
        borderBottomWidth=1.5,
        borderPadding=3
    )
    body_text = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=8.5,
        textColor=colors.HexColor('#374151'),
        leading=11,
        spaceAfter=4
    )
    return sidebar_heading, sidebar_text, main_name, main_title, section_heading, body_text


def _add_list_section(content, title, data, heading_style, text_style):
    """Helper to add a bulleted list section"""
    if not data:
        return
    content.append(Paragraph(title, heading_style))
    items = str(data).split(',') if data else []
    for item in items:
        item_clean = item.strip()
        if item_clean:
            content.append(Paragraph(f"• {item_clean}", text_style))
    content.append(Spacer(1, 0.1*inch))


def _add_section(content, title, data, heading_style, text_style, split_char=None):
    """Helper to add a text section"""
    if not data:
        return
    content.append(Paragraph(title, heading_style))
    if split_char:
        for line in str(data).split(split_char):
            if line.strip():
                content.append(Paragraph(line.strip(), text_style))
    else:
        content.append(Paragraph(str(data), text_style))
    content.append(Spacer(1, 0.06*inch))


def _add_projects_section(content, projects, heading_style, text_style):
    """Helper to add projects section"""
    if not projects:
        return
    content.append(Paragraph("PROJECTS", heading_style))
    for proj in str(projects).split('•'):
        proj_clean = proj.strip()
        if proj_clean:
            content.append(Paragraph(f"• {proj_clean}", text_style))
    content.append(Spacer(1, 0.06*inch))


def _add_certifications_section(content, certifications, heading_style, text_style):
    """Helper to add certifications section"""
    if certifications and 'TOOLS' not in str(certifications).upper():
        content.append(Paragraph("CERTIFICATIONS", heading_style))
        content.append(Paragraph(str(certifications), text_style))
        content.append(Spacer(1, 0.06*inch))


def _build_left_content(data, sidebar_heading, sidebar_text):
    """Helper function to build left sidebar content"""
    left_content = []
    left_content.append(Paragraph("CONTACT", sidebar_heading))
    email = data.get('email', 'email@example.com')
    phone = data.get('phone', '+91-XXXXXXXXXX')
    location = data.get('location', 'India')
    left_content.append(Paragraph(f"<b>Email:</b><br/>{email}", sidebar_text))
    left_content.append(Paragraph(f"<b>Phone:</b><br/>{phone}", sidebar_text))
    left_content.append(Paragraph(f"<b>Location:</b><br/>{location}", sidebar_text))
    left_content.append(Spacer(1, 0.12*inch))
    _add_list_section(left_content, "EDUCATION", data.get('education'), sidebar_heading, sidebar_text)
    _add_list_section(left_content, "SKILLS", data.get('skills'), sidebar_heading, sidebar_text)
    _add_list_section(left_content, "TOOLS", data.get('certifications'), sidebar_heading, sidebar_text)
    _add_list_section(left_content, "LANGUAGES", data.get('languages'), sidebar_heading, sidebar_text)
    return left_content


def _build_right_content(data, main_name, main_title, section_heading, body_text):
    """Helper function to build right main content"""
    right_content = []
    name = data.get('name', 'Professional')
    objective = data.get('objective', 'Career Professional')
    right_content.append(Paragraph(name, main_name))
    right_content.append(Paragraph(objective, main_title))
    right_content.append(Spacer(1, 0.08*inch))
    _add_section(right_content, "PROFILE", data.get('summary'), section_heading, body_text)
    _add_section(right_content, "EXPERIENCE", data.get('experience'), section_heading, body_text, split_char='\n')
    _add_projects_section(right_content, data.get('projects'), section_heading, body_text)
    _add_certifications_section(right_content, data.get('certifications'), section_heading, body_text)
    right_content.append(Paragraph("Declaration:", section_heading))
    right_content.append(Paragraph(
        "I hereby declare that every information furnished above is true to the best of my knowledge.",
        body_text
    ))
    return right_content


def generate_resume_pdf(data):
    """Generate a resume PDF using the centered single-column template."""
    try:
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=letter,
            topMargin=0.42 * inch,
            bottomMargin=0.42 * inch,
            leftMargin=0.52 * inch,
            rightMargin=0.52 * inch
        )

        styles = getSampleStyleSheet()
        content_width = letter[0] - doc.leftMargin - doc.rightMargin

        name_style = ParagraphStyle(
            'ResumeName',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=30,
            leading=32,
            alignment=1,
            textColor=colors.HexColor('#232126'),
            spaceAfter=2
        )
        title_style = ParagraphStyle(
            'ResumeTitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=15,
            leading=18,
            alignment=1,
            textColor=colors.HexColor('#4b4b52'),
            spaceAfter=12
        )
        contact_style = ParagraphStyle(
            'ResumeContact',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10.5,
            leading=12,
            alignment=1,
            textColor=colors.HexColor('#5b5a60')
        )
        section_title_style = ParagraphStyle(
            'ResumeSectionTitle',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=18,
            textColor=colors.HexColor('#232126'),
            spaceAfter=8,
            spaceBefore=2
        )
        meta_style = ParagraphStyle(
            'ResumeMeta',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10.5,
            leading=13,
            textColor=colors.HexColor('#6a6870'),
            spaceAfter=3
        )
        entry_title_style = ParagraphStyle(
            'ResumeEntryTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11.5,
            leading=14,
            textColor=colors.HexColor('#232126'),
            spaceAfter=3
        )
        body_style = ParagraphStyle(
            'ResumeBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10.5,
            leading=15,
            textColor=colors.HexColor('#4b4b52'),
            spaceAfter=4
        )
        list_style = ParagraphStyle(
            'ResumeList',
            parent=body_style,
            leftIndent=12,
            firstLineIndent=-8,
            spaceAfter=4
        )
        empty_style = ParagraphStyle(
            'ResumeEmpty',
            parent=body_style,
            textColor=colors.HexColor('#77737a')
        )

        def safe_text(value, fallback=""):
            text = str(value or fallback).strip()
            return escape(text) if text else ""

        def split_items(value, split_commas=False):
            if not value:
                return []
            pattern = r'[\r\n,;]+' if split_commas else r'[\r\n;]+'
            return [item.strip() for item in re.split(pattern, str(value)) if item.strip()]

        def split_title_and_org(value):
            parts = [part.strip() for part in str(value).split(',') if part.strip()]
            if len(parts) >= 2:
                return parts[0], ', '.join(parts[1:])
            return str(value).strip(), ""

        def parse_entry(raw, entry_type):
            text = str(raw or "").strip()
            if not text:
                return {"raw": "", "meta": "", "title": "", "description": ""}

            parts = [part.strip() for part in text.split('|') if part.strip()]
            meta = ""
            title = ""
            description = ""

            if entry_type in {"education", "experience"}:
                if len(parts) >= 4:
                    meta = f"{parts[0]} | {parts[1]}"
                    title = parts[2]
                    description = " | ".join(parts[3:])
                elif len(parts) == 3:
                    meta = f"{parts[0]} | {parts[1]}"
                    title = parts[2]
                elif len(parts) == 2:
                    title_part, org_part = split_title_and_org(parts[0])
                    meta = f"{org_part} | {parts[1]}" if org_part else f"{parts[0]} | {parts[1]}"
                    title = title_part if org_part else ""

            return {
                "raw": text,
                "meta": meta,
                "title": title,
                "description": description
            }

        def make_divider():
            divider = Table([['']], colWidths=[content_width])
            divider.setStyle(TableStyle([
                ('LINEABOVE', (0, 0), (-1, 0), 0.7, colors.HexColor('#656268')),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0)
            ]))
            return divider

        def add_section_header(story, title):
            story.append(Paragraph(safe_text(title), section_title_style))
            story.append(make_divider())
            story.append(Spacer(1, 0.12 * inch))

        def add_text_block(story, value, fallback):
            text = safe_text(value or fallback)
            story.append(Paragraph(text, body_style if value or fallback else empty_style))

        def add_entries(story, items, entry_type, empty_text):
            if not items:
                story.append(Paragraph(safe_text(empty_text), empty_style))
                return

            for index, item in enumerate(items):
                entry = parse_entry(item, entry_type)
                if entry['meta']:
                    story.append(Paragraph(safe_text(entry['meta']), meta_style))
                if entry['title']:
                    story.append(Paragraph(safe_text(entry['title']), entry_title_style))
                if entry['description']:
                    story.append(Paragraph(safe_text(entry['description']), body_style))
                if not entry['meta'] and not entry['title'] and not entry['description']:
                    story.append(Paragraph(safe_text(entry['raw']), body_style))
                if index != len(items) - 1:
                    story.append(Spacer(1, 0.08 * inch))

        def add_list(story, items, empty_text):
            if not items:
                story.append(Paragraph(safe_text(empty_text), empty_style))
                return
            for item in items:
                story.append(Paragraph(f'&#8226; {safe_text(item)}', list_style))

        def add_skill_grid(story, skills):
            if not skills:
                story.append(Paragraph("List your top professional skills.", empty_style))
                return

            columns = [[], [], []]
            for index, skill in enumerate(skills):
                columns[index % 3].append(Paragraph(f'&#8226; {safe_text(skill)}', list_style))

            row_count = max(len(column) for column in columns)
            rows = []
            blank = Paragraph("", list_style)
            for row_index in range(row_count):
                rows.append([
                    columns[0][row_index] if row_index < len(columns[0]) else blank,
                    columns[1][row_index] if row_index < len(columns[1]) else blank,
                    columns[2][row_index] if row_index < len(columns[2]) else blank
                ])

            skills_table = Table(rows, colWidths=[content_width / 3.0] * 3)
            skills_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(skills_table)

        summary = str(data.get('summary') or data.get('objective') or "").strip()
        education = split_items(data.get('education'))
        experience = split_items(data.get('experience'))
        skills = split_items(data.get('skills'), split_commas=True)
        projects = split_items(data.get('projects'))
        certifications = split_items(data.get('certifications'))
        languages = split_items(data.get('languages'), split_commas=True)

        story = []
        story.append(Paragraph(safe_text(str(data.get('name') or 'Professional').upper()), name_style))
        story.append(Paragraph(safe_text(data.get('objective') or 'Professional Profile'), title_style))

        contact_items = [
            safe_text(data.get('phone')),
            safe_text(data.get('email')),
            safe_text(data.get('location'))
        ]
        contact_items = [item for item in contact_items if item]
        if contact_items:
            contact_row = [[Paragraph(item, contact_style) for item in contact_items]]
            contact_table = Table(contact_row, colWidths=[content_width / len(contact_items)] * len(contact_items))
            contact_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(contact_table)
            story.append(Spacer(1, 0.12 * inch))

        add_section_header(story, "ABOUT ME")
        add_text_block(
            story,
            summary,
            "A motivated professional with strong communication, analytical thinking, and a focus on delivering meaningful results."
        )
        story.append(Spacer(1, 0.16 * inch))

        add_section_header(story, "EDUCATION")
        add_entries(story, education, "education", "Add your education details above.")
        story.append(Spacer(1, 0.16 * inch))

        add_section_header(story, "WORK EXPERIENCE")
        add_entries(story, experience, "experience", "Add your experience details above.")

        if projects:
            story.append(Spacer(1, 0.16 * inch))
            add_section_header(story, "PROJECTS")
            add_list(story, projects, "Add key projects or accomplishments.")

        if certifications:
            story.append(Spacer(1, 0.16 * inch))
            add_section_header(story, "CERTIFICATIONS")
            add_list(story, certifications, "Optional certifications go here.")

        if languages:
            story.append(Spacer(1, 0.16 * inch))
            add_section_header(story, "LANGUAGES")
            add_list(story, languages, "Include languages you know.")

        story.append(Spacer(1, 0.16 * inch))
        add_section_header(story, "SKILLS")
        add_skill_grid(story, skills)
        story.append(Spacer(1, 0.18 * inch))

        footer_bar = Table([['']], colWidths=[content_width], rowHeights=[18])
        footer_bar.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#6f6a6b')),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(footer_bar)

        doc.build(story)
        pdf_buffer.seek(0)
        return pdf_buffer

    except Exception as e:
        print(f"Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
        return None


# ✅ 3. Career Match Scoring
def score_career_matches(selected_tags=None, limit=3):
    """Score careers against quiz tags using overlap with career_paths.quiz_tags."""
    tags = [str(tag).strip().lower() for tag in (selected_tags or []) if str(tag).strip()]

    try:
        paths = query("SELECT id, title, field, quiz_tags FROM career_paths ORDER BY title")
    except Exception as e:
        print(f"Error loading career paths for quiz scoring: {e}")
        paths = []

    if not paths:
        return []

    scored = []
    for path in paths:
        quiz_tags = path.get("quiz_tags") or []
        if isinstance(quiz_tags, str):
            quiz_tags = [t.strip() for t in quiz_tags.split(",") if t.strip()]
        quiz_tags_lower = {t.lower() for t in quiz_tags}

        if tags and quiz_tags_lower:
            overlap = len(set(tags) & quiz_tags_lower)
            score = int(round((overlap / max(len(quiz_tags_lower), 1)) * 100))
            if overlap == 0:
                continue
        else:
            # Fallback when there are no selected tags (or no quiz tags on a row)
            score = 50

        scored.append({
            "career_path_id": str(path.get("id")),
            "title": path.get("title") or "Career Path",
            "field": path.get("field") or "General",
            "score": max(1, min(score, 100))
        })

    if not scored:
        # If nothing matched, return a default shortlist instead of failing the flow.
        scored = [{
            "career_path_id": str(path.get("id")),
            "title": path.get("title") or "Career Path",
            "field": path.get("field") or "General",
            "score": 40
        } for path in paths[: max(1, int(limit))]]

    scored.sort(key=lambda item: (-item["score"], item["title"]))
    return scored[: max(1, int(limit))]


# ✅ 4. Skill Gap Analysis
def skill_gap_analysis(user_skills, career_id):
    """Analyze skill gaps for a career"""
    try:
        rows = query("SELECT required_skills FROM career_paths WHERE id=%s", (career_id,))
        if not rows:
            return {"error": "Career not found"}

        required = rows[0].get("required_skills") or []
        if isinstance(required, str):
            required = [s.strip() for s in required.split(',')]

        user_lower = [s.lower() for s in user_skills]
        have = [s for s in required if s.lower() in user_lower]
        missing = [s for s in required if s.lower() not in user_lower]

        pct = round((len(have) / len(required)) * 100) if required else 0

        if pct >= 80:
            readiness = "You are well prepared for this career!"
        elif pct >= 50:
            readiness = "You are on the right track, keep learning!"
        else:
            readiness = "You have a lot to learn, but you can do it!"

        return {
            "have": have,
            "missing": missing,
            "completion_pct": pct,
            "readiness": readiness
        }

    except Exception as e:
        return {"error": str(e)}


# ✅ 5. Weekly Report
def generate_weekly_report(user_id):
    """Generate weekly progress report"""
    prompt = f"Generate a motivational weekly progress report for user {user_id} in PathPilot. Include achievements, focus areas, and next steps."
    return safe_generate(prompt)


ROADMAP_TEMPLATE_KEYS = {
    "Full Stack Developer": "fullstack",
    "Frontend Developer": "frontend",
    "Backend Developer": "backend",
    "Data Scientist": "data",
    "AI / ML Engineer": "ai_ml",
    "Cybersecurity Analyst": "cybersecurity",
    "Mobile App Developer": "mobile",
    "Cloud & DevOps Engineer": "devops",
    "QA / Automation Engineer": "qa",
    "Network Engineer": "network",
    "Database Administrator": "database",
    "IT Support / Systems Administrator": "support",
    "Game Developer": "game",
}


ROADMAP_TEMPLATES = {
    "fullstack": [
        ("Web Basics", "Learn HTML, CSS, JavaScript, Git, and how the web works.", ["MDN", "freeCodeCamp"]),
        ("JavaScript Practice", "Build small UI features and practice DOM, ES6, and async flows.", ["JavaScript.info", "Frontend Mentor"]),
        ("React Foundations", "Create reusable components, forms, routing, and state flows.", ["React Docs", "Scrimba"]),
        ("Backend APIs", "Learn Node.js or Python backend basics, REST APIs, and auth flows.", ["Node.js Docs", "FastAPI Docs"]),
        ("Databases", "Design tables, write SQL queries, and connect your API to a database.", ["PostgreSQL Docs", "SQLBolt"]),
        ("Full Stack Project", "Build an end-to-end app with login, CRUD, and deployment setup.", ["GitHub", "Render"]),
        ("Testing and Deployment", "Add tests, environment configs, CI basics, and production deployment.", ["Playwright Docs", "GitHub Actions"]),
        ("Portfolio and Interviews", "Polish resume, portfolio, and prepare for developer interviews.", ["LeetCode", "InterviewBit"]),
    ],
    "frontend": [
        ("Frontend Basics", "Learn HTML, CSS, responsive design, Git, and browser fundamentals.", ["MDN", "freeCodeCamp"]),
        ("Modern JavaScript", "Practice arrays, objects, fetch, async/await, and DOM patterns.", ["JavaScript.info", "Exercism"]),
        ("React Core", "Build components, props, state, events, and routing.", ["React Docs", "Scrimba"]),
        ("UI Systems", "Work with forms, reusable patterns, accessibility, and design systems.", ["A11y Project", "Frontend Mentor"]),
        ("TypeScript and API Integration", "Add typed components and connect frontend apps to APIs.", ["TypeScript Docs", "REST API Tutorial"]),
        ("Testing and Performance", "Write UI tests and improve loading, rendering, and accessibility.", ["Testing Library", "Lighthouse"]),
        ("Portfolio Project", "Build and deploy a polished frontend project.", ["Vercel", "Netlify"]),
        ("Interview Prep", "Prepare projects, resume, GitHub, and frontend interview questions.", ["GreatFrontEnd", "LeetCode"]),
    ],
    "backend": [
        ("Programming and Git", "Strengthen Python or Node.js basics, CLI skills, and Git workflows.", ["Python Docs", "Git Docs"]),
        ("Server Fundamentals", "Learn HTTP, routing, request handling, and backend project structure.", ["MDN HTTP", "FastAPI Docs"]),
        ("API Development", "Build REST APIs with validation, auth, and error handling.", ["Postman", "Node.js Docs"]),
        ("Databases", "Model relational data, write SQL, and build CRUD workflows.", ["PostgreSQL Docs", "SQLBolt"]),
        ("Security and Architecture", "Add authentication, authorization, logging, and clean layering.", ["OWASP", "System Design Primer"]),
        ("Caching and Queues", "Understand Redis, background jobs, and performance basics.", ["Redis Docs", "RabbitMQ Tutorials"]),
        ("Deployment", "Containerize, configure environments, and deploy backend services.", ["Docker Docs", "Render"]),
        ("Portfolio and Interviews", "Ship a production-style API project and prepare for backend interviews.", ["GitHub", "LeetCode"]),
    ],
    "data": [
        ("Python and SQL", "Build confidence with Python, SQL, notebooks, and data cleaning.", ["Kaggle Learn", "Mode SQL"]),
        ("Statistics", "Cover probability, distributions, hypothesis testing, and core metrics.", ["StatQuest", "Khan Academy"]),
        ("Data Analysis", "Use pandas, NumPy, and visualization tools to analyze real datasets.", ["Pandas Docs", "Matplotlib Docs"]),
        ("Machine Learning Basics", "Learn supervised learning, model evaluation, and feature engineering.", ["scikit-learn", "Hands-On ML"]),
        ("Projects", "Create end-to-end analysis projects with storytelling and dashboards.", ["Tableau Public", "GitHub"]),
        ("Advanced Topics", "Explore time series, NLP, experimentation, or recommendation basics.", ["Coursera", "Fast.ai"]),
        ("Portfolio and Communication", "Document projects, insights, and business recommendations clearly.", ["Notion", "Medium"]),
        ("Interview Prep", "Practice SQL, case studies, and machine learning interview questions.", ["StrataScratch", "Interview Query"]),
    ],
    "ai_ml": [
        ("Python and Math", "Reinforce Python, linear algebra, probability, and basic optimization.", ["Khan Academy", "NumPy Docs"]),
        ("ML Fundamentals", "Train classical ML models and learn evaluation methods.", ["scikit-learn", "Kaggle Learn"]),
        ("Deep Learning", "Study neural networks, CNNs, RNNs, and practical training loops.", ["PyTorch Docs", "DeepLearning.AI"]),
        ("Model Deployment", "Serve models through APIs and connect them to applications.", ["FastAPI Docs", "Docker Docs"]),
        ("MLOps Basics", "Track experiments, version models, and understand reproducible workflows.", ["MLflow Docs", "Weights & Biases"]),
        ("Applied AI Project", "Ship an end-to-end ML or AI project with measurable outcomes.", ["GitHub", "Hugging Face"]),
        ("Specialization", "Explore LLM apps, computer vision, or recommendation systems.", ["Hugging Face", "Papers with Code"]),
        ("Interview Prep", "Prepare for ML coding rounds, project deep dives, and system questions.", ["LeetCode", "Machine Learning Interviews Book"]),
    ],
    "cybersecurity": [
        ("Networking and Linux", "Learn TCP/IP, Linux commands, logs, and system basics.", ["TryHackMe", "Cisco Skills for All"]),
        ("Security Fundamentals", "Cover access control, encryption, common threats, and security hygiene.", ["CompTIA Security+", "OWASP"]),
        ("Hands-on Labs", "Practice scanning, enumeration, SIEM basics, and incident workflows.", ["Hack The Box", "Splunk Training"]),
        ("Scripting and Automation", "Use Python and Bash for automation, parsing, and investigations.", ["Python Docs", "Bash Guide"]),
        ("Defensive Security", "Study monitoring, alerting, hardening, and response playbooks.", ["Blue Team Labs", "Microsoft Learn"]),
        ("Offensive Basics", "Understand web testing, pentest workflow, and vulnerability reporting.", ["PortSwigger Academy", "OWASP Juice Shop"]),
        ("Portfolio and Certifications", "Document labs, reports, and prepare for starter certifications.", ["GitHub", "CompTIA"]),
        ("Interview Prep", "Revise scenarios, terminology, and hands-on walkthroughs.", ["TryHackMe", "Cybrary"]),
    ],
    "mobile": [
        ("Programming Foundations", "Strengthen JavaScript or Dart and mobile app architecture basics.", ["JavaScript.info", "Dart Docs"]),
        ("Framework Setup", "Start React Native or Flutter and build core screens and navigation.", ["React Native Docs", "Flutter Docs"]),
        ("App Features", "Handle forms, local state, API calls, and storage.", ["Expo Docs", "Firebase Docs"]),
        ("Native Concepts", "Learn permissions, device APIs, build variants, and debugging.", ["Android Docs", "Apple Developer"]),
        ("State and Testing", "Improve state handling, testing, and app reliability.", ["Redux Toolkit", "Testing Library"]),
        ("App Project", "Build a complete mobile app with auth, APIs, and polished UI.", ["GitHub", "Figma"]),
        ("Release Prep", "Prepare store assets, builds, analytics, and performance fixes.", ["Google Play Console", "App Store Connect"]),
        ("Portfolio and Interviews", "Document mobile projects and practice platform questions.", ["GitHub", "LeetCode"]),
    ],
    "devops": [
        ("Linux and Scripting", "Learn Linux commands, shell scripting, processes, and permissions.", ["Linux Journey", "Bash Guide"]),
        ("Version Control and CI", "Use Git well and automate checks with CI pipelines.", ["Git Docs", "GitHub Actions"]),
        ("Containers", "Understand Docker images, containers, networks, and compose basics.", ["Docker Docs", "Play with Docker"]),
        ("Cloud Fundamentals", "Study compute, storage, networking, and IAM in a cloud platform.", ["AWS Skill Builder", "Microsoft Learn"]),
        ("Infrastructure as Code", "Provision infra with Terraform and manage repeatable environments.", ["Terraform Docs", "KodeKloud"]),
        ("Kubernetes and Observability", "Deploy workloads, logs, metrics, and health checks.", ["Kubernetes Docs", "Prometheus Docs"]),
        ("DevOps Project", "Build and deploy a CI/CD pipeline for a real project.", ["GitHub", "Render"]),
        ("Interview Prep", "Prepare cloud, Docker, CI/CD, and troubleshooting questions.", ["KodeKloud", "DevOps Roadmap"]),
    ],
    "qa": [
        ("Testing Basics", "Learn SDLC, STLC, test cases, bug reports, and quality mindset.", ["Guru99", "ISTQB"]),
        ("Manual Testing Practice", "Test real apps, write cases, and manage defects clearly.", ["Jira", "TestRail"]),
        ("API and Database Testing", "Use Postman and SQL to validate backend flows.", ["Postman", "SQLBolt"]),
        ("Automation Setup", "Start Selenium or Playwright and automate core browser scenarios.", ["Playwright Docs", "Selenium Docs"]),
        ("Framework Design", "Organize test suites, locators, fixtures, and reusable utilities.", ["Test Automation University", "GitHub"]),
        ("CI and Reporting", "Run tests in CI and publish reliable reports.", ["GitHub Actions", "Allure"]),
        ("Portfolio Project", "Create a test automation suite for a sample product.", ["Demo QA", "GitHub"]),
        ("Interview Prep", "Prepare testing concepts, SQL, API, and automation interview rounds.", ["ISTQB", "Interview Questions"]),
    ],
    "network": [
        ("Network Foundations", "Learn OSI, TCP/IP, subnetting, routing, and switching.", ["Cisco CCNA", "Professor Messer"]),
        ("Hands-on Labs", "Configure routers, switches, VLANs, and troubleshoot common faults.", ["Cisco Packet Tracer", "GNS3"]),
        ("Linux and Services", "Practice Linux networking tools, DNS, DHCP, and monitoring.", ["Linux Journey", "Wireshark"]),
        ("Security Basics", "Study firewalls, VPNs, ACLs, and secure network design.", ["CompTIA Network+", "Fortinet Training"]),
        ("Automation", "Use Python to automate repetitive network tasks and inventory checks.", ["Python Docs", "Netmiko"]),
        ("Cloud and Enterprise Networking", "Explore hybrid networking, load balancers, and enterprise topologies.", ["AWS Networking", "Azure Networking"]),
        ("Certification and Labs", "Document lab work and prepare for CCNA or Network+.", ["Cisco Skills for All", "Juniper Learning"]),
        ("Interview Prep", "Revise troubleshooting, protocols, and design scenarios.", ["Packet Pushers", "Interview Questions"]),
    ],
    "database": [
        ("SQL and Data Modeling", "Master joins, normalization, indexing, and schema design.", ["PostgreSQL Docs", "SQLBolt"]),
        ("Administration Basics", "Handle installs, backups, restores, users, and permissions.", ["PostgreSQL Tutorial", "MySQL Docs"]),
        ("Performance Tuning", "Read execution plans and optimize slow queries and indexes.", ["EXPLAIN Docs", "Use The Index, Luke"]),
        ("Reliability", "Learn replication, failover, monitoring, and backup strategies.", ["Percona", "pgAdmin"]),
        ("Cloud Databases", "Work with managed databases and operational best practices.", ["AWS RDS", "Azure SQL"]),
        ("Automation", "Script routine maintenance and health checks.", ["Python Docs", "Bash Guide"]),
        ("Project and Documentation", "Run a database project with documented admin workflows.", ["GitHub", "Notion"]),
        ("Interview Prep", "Practice SQL, performance, and admin scenario questions.", ["LeetCode SQL", "Interview Questions"]),
    ],
    "support": [
        ("IT Support Basics", "Cover hardware, OS basics, troubleshooting flow, and documentation.", ["Google IT Support", "CompTIA A+"]),
        ("Operating Systems", "Practice Windows, Linux, users, services, and system setup.", ["Microsoft Learn", "Linux Journey"]),
        ("Networking Basics", "Learn IP, Wi-Fi, DNS, printers, and office connectivity issues.", ["Professor Messer", "Cisco Skills for All"]),
        ("Support Tools", "Use ticketing systems, remote access tools, and support workflows.", ["Jira Service Management", "Freshservice"]),
        ("System Administration", "Understand Active Directory, policies, backups, and access management.", ["Microsoft Learn", "PowerShell Docs"]),
        ("Security and Compliance", "Learn endpoint safety, patching, MFA, and user awareness.", ["Microsoft Security", "Google Workspace Admin"]),
        ("Hands-on Lab", "Document common fixes and build a mini support knowledge base.", ["Notion", "GitHub"]),
        ("Interview Prep", "Prepare troubleshooting scenarios and user-support communication rounds.", ["CompTIA", "Help Desk Interview Questions"]),
    ],
    "game": [
        ("Programming and Engines", "Learn C# or C++ fundamentals and game engine basics.", ["Unity Learn", "Unreal Docs"]),
        ("Gameplay Systems", "Build movement, interactions, UI, and scene management.", ["Brackeys", "GameDev.tv"]),
        ("Physics and Animation", "Work with collisions, animation states, and responsive controls.", ["Unity Docs", "Unreal Learning"]),
        ("Game Design Basics", "Study level design, balancing, and player feedback loops.", ["GDC Talks", "Extra Credits"]),
        ("Advanced Features", "Add AI, save systems, audio, and optimization.", ["Unity Learn", "FMOD"]),
        ("Game Project", "Build a playable prototype with menus, polish, and testing.", ["GitHub", "itch.io"]),
        ("Publishing Basics", "Prepare builds, store pages, trailers, and portfolio materials.", ["Steamworks Docs", "Google Play Console"]),
        ("Interview Prep", "Practice engine, math, gameplay, and portfolio discussions.", ["LeetCode", "Game Dev Interviews"]),
    ],
}


def _roadmap_item(week_number, title, description, resources):
    return {
        "week_number": week_number,
        "title": title,
        "description": description,
        "resources": resources[:4],
    }


def _normalize_roadmap_items(items, weeks):
    normalized = []
    for idx, item in enumerate(items or [], start=1):
        if idx > weeks or not isinstance(item, dict):
            break
        title = str(item.get("title") or f"Week {idx} Focus").strip()
        description = str(item.get("description") or "Keep building practical skills.").strip()
        resources = item.get("resources") if isinstance(item.get("resources"), list) else []
        resources = [str(resource).strip() for resource in resources if str(resource).strip()]
        normalized.append(_roadmap_item(idx, title, description, resources or ["Docs", "Practice"]))
    return normalized


def _build_template_roadmap(template_key, weeks):
    base_plan = ROADMAP_TEMPLATES.get(template_key, [])
    plan = list(base_plan)
    extras = [
        ("Capstone Build", "Ship a realistic project that proves your skills end to end.", ["GitHub", "Documentation"]),
        ("Portfolio Polish", "Refine README files, demos, and resume bullets from your work.", ["GitHub", "Notion"]),
        ("Interview and Applications", "Practice interviews and apply to internships or entry-level roles.", ["LeetCode", "LinkedIn"]),
    ]

    while len(plan) < weeks:
        plan.append(extras[(len(plan) - len(base_plan)) % len(extras)])

    return [
        _roadmap_item(week, title, description, resources)
        for week, (title, description, resources) in enumerate(plan[:weeks], start=1)
    ]


def _build_skill_based_roadmap(career, weeks):
    title = career.get("title", "Career")
    skills = list(career.get("required_skills") or [])
    courses = list(career.get("recommended_courses") or [])

    plan = [
        _roadmap_item(1, f"{title} Fundamentals", f"Understand the core concepts, tools, and day-to-day work in {title}.", courses[:2] or ["Official Docs", "YouTube"]),
    ]

    for skill in skills[:max(1, weeks - 3)]:
        if len(plan) >= weeks - 2:
            break
        plan.append(
            _roadmap_item(
                len(plan) + 1,
                f"Core Skill: {skill}",
                f"Practice {skill} with small hands-on exercises and notes you can revisit.",
                courses[:2] or ["Official Docs", "Practice Project"],
            )
        )

    for extra_title, extra_desc in [
        ("Project Work", "Build one solid portfolio project that shows practical ability."),
        ("Portfolio and Resume", "Turn your work into a portfolio, polished GitHub, and resume bullets."),
        ("Interview Prep", "Revise fundamentals, solve role-specific questions, and start applying."),
    ]:
        if len(plan) < weeks:
            plan.append(_roadmap_item(len(plan) + 1, extra_title, extra_desc, courses[:2] or ["Docs", "Practice"]))

    return plan[:weeks]


def _generate_ai_roadmap(career, weeks):
    prompt = f"""Generate a {weeks}-week learning roadmap for this PathPilot career.
Return only valid JSON array with objects: week_number, title, description, resources.

Career title: {career.get('title')}
Field: {career.get('field')}
Required skills: {career.get('required_skills')}
Nice to have skills: {career.get('nice_to_have_skills')}
Recommended courses: {career.get('recommended_courses')}
Common job roles: {career.get('job_roles')}

Rules:
- one milestone per week
- practical and beginner-friendly
- include projects, portfolio, and interview prep near the end
- resources must be a short array of strings
- no markdown, no explanation, JSON only"""

    response = safe_generate(prompt)
    return _normalize_roadmap_items(json.loads(response), weeks)


# ✅ 6. Roadmap Generator
def generate_roadmap_milestones(career_id, weeks):
    """Generate learning roadmap milestones"""
    try:
        career = query(
            """SELECT title, field, required_skills, nice_to_have_skills,
                      recommended_courses, job_roles
               FROM career_paths
               WHERE id=%s""",
            (career_id,),
            fetch="one"
        ) or {}

        template_key = ROADMAP_TEMPLATE_KEYS.get(career.get("title"))
        if template_key:
            return _build_template_roadmap(template_key, weeks)

        try:
            ai_plan = _generate_ai_roadmap(career, weeks)
            if ai_plan:
                return ai_plan
        except Exception as parse_error:
            print(f"AI roadmap fallback for {career.get('title', career_id)}: {parse_error}")

        return _build_skill_based_roadmap(career, weeks)

    except Exception as e:
        print(f"Error generating roadmap: {e}")
        return []
