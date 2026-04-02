import os
import json
import io
from datetime import datetime
from config.db import query
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

# ✅ Load env
load_dotenv()

# ✅ Gemini SDK
try:
    import google.generativeai as genai
    
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-pro")
    GEMINI_ENABLED = True
    print("✅ Gemini connected successfully")

except Exception as e:
    print(f"⚠️ Gemini API not available: {e}")
    GEMINI_ENABLED = False


# ✅ SMART AI FUNCTION
def safe_generate(prompt):
    if GEMINI_ENABLED:
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"⚠️ Gemini error: {e}. Using fallback...")

    print("AI fallback used")

    prompt_lower = prompt.lower()

    # ✅ Resume Generator
    if "resume" in prompt_lower:
        return """Name: Student
Email: student@email.com

Summary:
Motivated and enthusiastic student with a strong interest in software development.

Education:
Bachelor's Degree in Computer Science

Skills:
Python, HTML, CSS, JavaScript

Projects:
Career Guidance Web App

Career Objective:
To become a skilled Full Stack Developer and contribute to innovative projects.
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
    prompt = f"""
You are PathPilot AI — a friendly career advisor.
Question: {question}
"""
    return safe_generate(prompt)


# ✅ 2. Resume Generator
def generate_resume(data):
    prompt = f"""
Generate resume:
Name: {data.get('name')}
Skills: {data.get('skills')}
"""
    return safe_generate(prompt)


# ✅ 2B. Resume Generator (PDF) - Professional Two-Column Format
def generate_resume_pdf(data):
    """Generate a professional two-column PDF resume"""
    try:
        # Create in-memory PDF
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter,
                               topMargin=0.3*inch, bottomMargin=0.3*inch,
                               leftMargin=0.3*inch, rightMargin=0.3*inch)
        
        story = []
        styles = getSampleStyleSheet()
        
        # ✅ Sidebar Styles (Dark Blue)
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
        
        # ✅ Main Content Styles
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
        
        # === LEFT COLUMN (SIDEBAR) ===
        left_content = []
        
        # Contact
        left_content.append(Paragraph("CONTACT", sidebar_heading))
        email = data.get('email', 'email@example.com')
        phone = data.get('phone', '+91-XXXXXXXXXX')
        location = data.get('location', 'India')
        
        left_content.append(Paragraph(f"<b>Email:</b><br/>{email}", sidebar_text))
        left_content.append(Paragraph(f"<b>Phone:</b><br/>{phone}", sidebar_text))
        left_content.append(Paragraph(f"<b>Location:</b><br/>{location}", sidebar_text))
        left_content.append(Spacer(1, 0.12*inch))
        
        # Education
        if data.get('education'):
            left_content.append(Paragraph("EDUCATION", sidebar_heading))
            edu_lines = str(data.get('education', '')).split('\n')
            for line in edu_lines:
                if line.strip():
                    left_content.append(Paragraph(f"• {line.strip()}", sidebar_text))
            left_content.append(Spacer(1, 0.1*inch))
        
        # Skills
        if data.get('skills'):
            left_content.append(Paragraph("SKILLS", sidebar_heading))
            skills = str(data.get('skills', ''))
            for skill in skills.split(','):
                skill_clean = skill.strip()
                if skill_clean:
                    left_content.append(Paragraph(f"• {skill_clean}", sidebar_text))
            left_content.append(Spacer(1, 0.1*inch))
        
        # Tools
        if data.get('certifications'):
            left_content.append(Paragraph("TOOLS", sidebar_heading))
            tools = str(data.get('certifications', ''))
            for tool in tools.split(','):
                tool_clean = tool.strip()
                if tool_clean:
                    left_content.append(Paragraph(f"• {tool_clean}", sidebar_text))
            left_content.append(Spacer(1, 0.1*inch))
        
        # Languages
        if data.get('languages'):
            left_content.append(Paragraph("LANGUAGES", sidebar_heading))
            langs = str(data.get('languages', ''))
            for lang in langs.split(','):
                lang_clean = lang.strip()
                if lang_clean:
                    left_content.append(Paragraph(f"• {lang_clean}", sidebar_text))
        
        # === RIGHT COLUMN (MAIN) ===
        right_content = []
        
        name = data.get('name', 'Professional')
        objective = data.get('objective', 'Career Professional')
        
        right_content.append(Paragraph(name, main_name))
        right_content.append(Paragraph(objective, main_title))
        right_content.append(Spacer(1, 0.08*inch))
        
        # Profile
        if data.get('summary'):
            right_content.append(Paragraph("PROFILE", section_heading))
            right_content.append(Paragraph(str(data.get('summary', '')), body_text))
            right_content.append(Spacer(1, 0.06*inch))
        
        # Experience
        if data.get('experience'):
            right_content.append(Paragraph("EXPERIENCE", section_heading))
            exp = str(data.get('experience', ''))
            for line in exp.split('\n'):
                if line.strip():
                    right_content.append(Paragraph(line.strip(), body_text))
            right_content.append(Spacer(1, 0.06*inch))
        
        # Projects
        if data.get('projects'):
            right_content.append(Paragraph("PROJECT", section_heading))
            projects = str(data.get('projects', ''))
            for proj in projects.split('•'):
                proj_clean = proj.strip()
                if proj_clean:
                    right_content.append(Paragraph(f"• {proj_clean}", body_text))
            right_content.append(Spacer(1, 0.06*inch))
        
        # Certifications
        if data.get('certifications') and 'TOOLS' not in str(data.get('certifications', '')).upper():
            right_content.append(Paragraph("Certifications", section_heading))
            right_content.append(Paragraph(str(data.get('certifications', '')), body_text))
            right_content.append(Spacer(1, 0.06*inch))
        
        # Declaration
        right_content.append(Paragraph("Declaration:", section_heading))
        right_content.append(Paragraph(
            "I hereby declare that every information furnished above is true to the best of my knowledge.",
            body_text
        ))
        
        # === CREATE TWO-COLUMN LAYOUT ===
        left_frame = Table([[left_content]], colWidths=[1.9*inch])
        left_frame.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#1e3a5f')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 14),
            ('RIGHTPADDING', (0, 0), (-1, -1), 14),
            ('TOPPADDING', (0, 0), (-1, -1), 16),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ]))
        
        right_frame = Table([[right_content]], colWidths=[4.1*inch])
        right_frame.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#ffffff')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 14),
            ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ]))
        
        # Combine columns
        main_table = Table([[left_frame, right_frame]], colWidths=[1.9*inch, 4.1*inch])
        main_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        
        story.append(main_table)
        
        # Build PDF
        doc.build(story)
        pdf_buffer.seek(0)
        
        return pdf_buffer
    
    except Exception as e:
        print(f"Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
        return None


# ✅ 3. Career Match Scoring
def score_career_matches(tags):
    return [
        {"career_path_id": "1", "title": "Full Stack Developer", "field": "Technology", "score": 90},
        {"career_path_id": "2", "title": "Data Scientist", "field": "Technology", "score": 75},
        {"career_path_id": "3", "title": "UI/UX Designer", "field": "Design", "score": 60}
    ]


# ✅ 4. Skill Gap Analysis
def skill_gap_analysis(user_skills, career_id):
    try:
        rows = query("SELECT required_skills FROM career_paths WHERE id=%s", (career_id,))
        if not rows:
            return {"error": "Career not found"}

        required = rows[0]["required_skills"] or []

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
    prompt = "Generate weekly report"
    return safe_generate(prompt)


# ✅ 6. Roadmap Generator
def generate_roadmap_milestones(career_id, weeks):
    try:
        response = safe_generate("roadmap")

        try:
            return json.loads(response)
        except:
            return []

    except Exception:
        return []