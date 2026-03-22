-- ═══════════════════════════════════════════════════════════
--  PathPilot v2 — Seed Data
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- CAREER PATHS (10 diverse paths)
-- ─────────────────────────────────────────
INSERT INTO career_paths (title, field, description, avg_salary_inr, avg_salary_usd, growth_rate, difficulty, time_to_entry, required_skills, nice_to_have_skills, recommended_courses, top_companies, job_roles, icon_emoji, quiz_tags) VALUES

('Full Stack Developer', 'Technology',
 'Build complete web applications — from beautiful UIs to robust APIs and databases. High demand across every industry.',
 '₹6L – ₹25L/yr', '$85K – $130K/yr', '25% (Much faster)', 'moderate', '6–12 months',
 ARRAY['HTML/CSS','JavaScript','React/Vue','Node.js','SQL','Git','REST APIs'],
 ARRAY['TypeScript','Docker','AWS','Redis'],
 ARRAY['The Odin Project','freeCodeCamp','Full Stack Open','CS50 Web'],
 ARRAY['Google','Infosys','Startups','Freelance'],
 ARRAY['Frontend Dev','Backend Dev','Full Stack Engineer','SDE-1'],
 '💻', ARRAY['tech','coding','problem-solving','building']),

('Data Scientist', 'Technology',
 'Extract insights from complex datasets using statistics, machine learning, and storytelling to drive smarter decisions.',
 '₹8L – ₹30L/yr', '$95K – $145K/yr', '35% (Much faster)', 'hard', '8–18 months',
 ARRAY['Python','Statistics','Machine Learning','SQL','Data Visualization','Pandas','NumPy'],
 ARRAY['Deep Learning','Spark','Cloud ML','R'],
 ARRAY['Fast.ai','Kaggle Learn','Applied ML (Coursera)','StatQuest YouTube'],
 ARRAY['Amazon','Microsoft','Flipkart','Research Labs','Startups'],
 ARRAY['Data Scientist','ML Engineer','Data Analyst','Research Scientist'],
 '📊', ARRAY['data','analysis','math','research','patterns']),

('UX/UI Designer', 'Design',
 'Design digital experiences that are beautiful, intuitive, and meaningful. The bridge between users and technology.',
 '₹5L – ₹20L/yr', '$70K – $115K/yr', '13% (Faster)', 'moderate', '4–10 months',
 ARRAY['Figma','User Research','Wireframing','Prototyping','Typography','Color Theory'],
 ARRAY['Motion Design','Framer','Accessibility','Design Systems'],
 ARRAY['Google UX Certificate','Interaction Design Foundation','Refactoring UI'],
 ARRAY['Adobe','Swiggy','Zomato','Design Agencies','Startups'],
 ARRAY['UX Designer','UI Designer','Product Designer','Design Lead'],
 '🎨', ARRAY['design','creativity','empathy','visual','art']),

('Product Manager', 'Business',
 'Own the product vision. Work at the intersection of tech, business, and user needs to ship features that matter.',
 '₹10L – ₹35L/yr', '$90K – $140K/yr', '10% (Average)', 'hard', '1–3 years (usually after other roles)',
 ARRAY['Product Strategy','User Research','Agile/Scrum','Analytics','Communication','SQL'],
 ARRAY['A/B Testing','Growth Hacking','Finance Basics'],
 ARRAY['Reforge','Product School','Lenny''s Newsletter','PM Exercises'],
 ARRAY['Razorpay','CRED','Google','Microsoft','Startups'],
 ARRAY['Product Manager','APM','Senior PM','Head of Product'],
 '🗺️', ARRAY['leadership','strategy','business','communication','planning']),

('Cybersecurity Analyst', 'Technology',
 'Defend organizations from digital threats. Monitor, detect, respond, and prevent attacks in a high-stakes field.',
 '₹5L – ₹22L/yr', '$80K – $125K/yr', '32% (Much faster)', 'hard', '6–15 months',
 ARRAY['Networking','Linux','Python','SIEM Tools','Ethical Hacking','Cryptography'],
 ARRAY['Cloud Security','Forensics','Reverse Engineering'],
 ARRAY['CompTIA Security+','TryHackMe','Cybrary','EC-Council CEH'],
 ARRAY['TCS','HCL','CERT-In','Banks','Government'],
 ARRAY['SOC Analyst','Pen Tester','Security Engineer','CISO (senior)'],
 '🛡️', ARRAY['security','tech','problem-solving','detective-thinking']),

('Digital Marketing Specialist', 'Business',
 'Grow brands online using SEO, social media, paid advertising, email campaigns, and data-driven content strategies.',
 '₹3L – ₹15L/yr', '$55K – $90K/yr', '10% (Average)', 'easy', '2–6 months',
 ARRAY['SEO/SEM','Google Analytics','Meta Ads','Content Strategy','Email Marketing','Copywriting'],
 ARRAY['Video Marketing','Marketing Automation','CRO'],
 ARRAY['Google Digital Garage','HubSpot Academy','CXL Institute','Moz Blog'],
 ARRAY['Agencies','E-commerce','Media Companies','Startups'],
 ARRAY['SEO Specialist','Performance Marketer','Content Strategist','Growth Hacker'],
 '📣', ARRAY['marketing','communication','creativity','social-media','writing']),

('Mobile App Developer', 'Technology',
 'Build apps used by millions on iOS and Android. From indie apps to enterprise solutions.',
 '₹6L – ₹22L/yr', '$80K – $125K/yr', '22% (Much faster)', 'moderate', '6–12 months',
 ARRAY['React Native or Flutter','JavaScript or Dart','REST APIs','Git','App Store Deployment'],
 ARRAY['Native iOS (Swift)','Native Android (Kotlin)','Firebase','Redux'],
 ARRAY['Flutter.dev docs','React Native docs','Angela Yu iOS Course','Academind'],
 ARRAY['Startups','Gaming Companies','Health-tech','Freelance'],
 ARRAY['Mobile Developer','iOS Engineer','Android Engineer','Flutter Dev'],
 '📱', ARRAY['tech','coding','building','mobile','apps']),

('Cloud & DevOps Engineer', 'Technology',
 'Build and maintain the infrastructure that powers the internet. Automate, scale, and ensure reliability.',
 '₹8L – ₹30L/yr', '$95K – $140K/yr', '28% (Much faster)', 'hard', '8–18 months',
 ARRAY['Linux','Docker','Kubernetes','AWS/GCP/Azure','CI/CD','Python/Bash','Terraform'],
 ARRAY['Prometheus','Grafana','Service Mesh'],
 ARRAY['AWS Solutions Architect','Linux Foundation','KodeKloud','A Cloud Guru'],
 ARRAY['Amazon','Microsoft','Deloitte','Infra Startups'],
 ARRAY['DevOps Engineer','Cloud Architect','SRE','Platform Engineer'],
 '☁️', ARRAY['tech','infrastructure','automation','problem-solving']),

('Content Creator / YouTuber', 'Media',
 'Build an audience by creating valuable video, written, or audio content. Monetize through ads, sponsorships, and products.',
 '₹1L – ₹50L+/yr', '$10K – $500K+/yr', '15% (Faster)', 'easy', '1–3 years to monetize',
 ARRAY['Video Editing','Storytelling','SEO','Thumbnail Design','Scriptwriting','Analytics'],
 ARRAY['Premiere Pro','After Effects','Podcast Production'],
 ARRAY['YouTube Creator Academy','Canva Design School','Think Media YouTube'],
 ARRAY['YouTube','Instagram','Podcasting Platforms','Brand Deals'],
 ARRAY['YouTuber','Podcaster','Blogger','Course Creator','Brand Ambassador'],
 '🎬', ARRAY['creativity','communication','storytelling','media','art']),

('Financial Analyst', 'Finance',
 'Analyze financial data, forecast trends, and provide investment recommendations to drive business strategy.',
 '₹5L – ₹20L/yr', '$65K – $110K/yr', '9% (Average)', 'moderate', '6–12 months',
 ARRAY['Excel/Google Sheets','Financial Modeling','Accounting Basics','Statistics','Python'],
 ARRAY['Bloomberg','Power BI','SQL','CFA Certification'],
 ARRAY['CFI Financial Modeling','Coursera Finance Specialization','CFA Program'],
 ARRAY['Banks','NBFC','Big 4 Firms','Investment Firms','Startups'],
 ARRAY['Financial Analyst','Investment Analyst','Equity Researcher','CFO (senior)'],
 '💹', ARRAY['finance','numbers','analysis','business','math']);

-- ─────────────────────────────────────────
-- CAREER QUIZ QUESTIONS
-- ─────────────────────────────────────────
INSERT INTO quiz_questions (question, options, category, order_num) VALUES

('When you have free time, what do you naturally gravitate towards?',
 '[
   {"text": "Building or coding something — apps, scripts, tools", "tags": ["tech","coding","building"]},
   {"text": "Designing or creating visual content", "tags": ["design","creativity","visual","art"]},
   {"text": "Reading about business, startups, or finance", "tags": ["business","finance","strategy"]},
   {"text": "Writing, making videos, or telling stories", "tags": ["communication","storytelling","media","writing"]}
 ]'::jsonb, 'interests', 1),

('Which of these problems excites you most to solve?',
 '[
   {"text": "Why is this website slow? How do I make it faster?", "tags": ["tech","problem-solving","infrastructure"]},
   {"text": "Why do users drop off here? How do I improve this experience?", "tags": ["design","empathy","product","ux"]},
   {"text": "Why is this company losing money? What can change?", "tags": ["business","analysis","finance","strategy"]},
   {"text": "How do I grow this product''s audience by 10x?", "tags": ["marketing","growth","communication","social-media"]}
 ]'::jsonb, 'problem-type', 2),

('What kind of work environment energizes you?',
 '[
   {"text": "Deep solo work — headphones in, in the zone", "tags": ["coding","research","data","writing"]},
   {"text": "Creative collaboration — brainstorming with a team", "tags": ["design","product","leadership","creativity"]},
   {"text": "Fast-paced, high-stakes situations", "tags": ["security","finance","leadership","strategy"]},
   {"text": "Public-facing — talking, presenting, creating", "tags": ["marketing","communication","media","storytelling"]}
 ]'::jsonb, 'work-style', 3),

('Which subject or activity did you enjoy most in school/college?',
 '[
   {"text": "Mathematics, logic, or programming", "tags": ["tech","math","coding","data","problem-solving"]},
   {"text": "Arts, design, or media production", "tags": ["design","creativity","visual","art","media"]},
   {"text": "Economics, business studies, or entrepreneurship", "tags": ["business","finance","strategy","planning"]},
   {"text": "Writing, communication, or social sciences", "tags": ["writing","communication","empathy","storytelling"]}
 ]'::jsonb, 'academic', 4),

('What does success look like to you in 5 years?',
 '[
   {"text": "Building products millions of people use", "tags": ["tech","coding","product","building"]},
   {"text": "Running my own creative studio or brand", "tags": ["design","media","creativity","storytelling","art"]},
   {"text": "Leading a team and shaping company strategy", "tags": ["leadership","business","strategy","planning","product"]},
   {"text": "Financial freedom through smart investments or a business", "tags": ["finance","business","analysis"]}
 ]'::jsonb, 'goals', 5),

('How do you prefer to communicate your ideas?',
 '[
   {"text": "Through code, data, or technical demos", "tags": ["tech","data","problem-solving"]},
   {"text": "Through visuals, mockups, or design presentations", "tags": ["design","visual","creativity"]},
   {"text": "Through documents, reports, or strategic plans", "tags": ["business","writing","analysis","finance"]},
   {"text": "Through videos, posts, talks, or storytelling", "tags": ["media","communication","storytelling","marketing"]}
 ]'::jsonb, 'communication', 6);

-- ─────────────────────────────────────────
-- BADGES
-- ─────────────────────────────────────────
INSERT INTO badges (slug, name, description, icon_emoji, xp_reward) VALUES
('first_goal',       'Goal Setter',        'Created your first goal',                     '🎯', 50),
('first_focus',      'Focus Starter',      'Completed your first Pomodoro session',       '⏱️', 50),
('week_streak_7',    '7-Day Streak',       'Studied for 7 days in a row',                 '🔥', 200),
('week_streak_30',   '30-Day Warrior',     'Studied for 30 days straight',                '⚡', 1000),
('goal_crusher_5',   'Goal Crusher',       'Completed 5 goals',                           '💪', 300),
('career_explorer',  'Career Explorer',    'Saved 3 or more career paths',                '🧭', 100),
('quiz_taker',       'Path Finder',        'Completed the career quiz',                   '🔮', 100),
('mood_tracker_7',   'Self-Aware',         'Tracked your mood for 7 days',                '🧘', 150),
('study_100h',       'Century Club',       'Logged 100 hours of study time',              '💯', 500),
('roadmap_builder',  'Road Warrior',       'Created your first learning roadmap',         '🗺️', 100);