import sys
sys.path.insert(0, '.')
from utils.ai_engine import generate_resume_pdf

data = {
    'name': 'Test User', 
    'email': 'test@example.com', 
    'phone': '+91-123', 
    'location': 'India', 
    'skills': 'Python, React', 
    'objective': 'Developer'
}

try:
    pdf = generate_resume_pdf(data)
    if pdf:
        print(f"✅ PDF Generated successfully: {len(pdf.getvalue())} bytes")
    else:
        print("❌ PDF is None")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
