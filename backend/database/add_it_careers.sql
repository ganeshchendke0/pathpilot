-- Add expanded IT career paths without resetting the existing database.

INSERT INTO career_paths (
    title, field, description, avg_salary_inr, avg_salary_usd, growth_rate,
    difficulty, time_to_entry, required_skills, nice_to_have_skills,
    recommended_courses, top_companies, job_roles, icon_emoji, quiz_tags
)
SELECT
    'Frontend Developer', 'Technology',
    'Build fast, accessible, and responsive user interfaces for modern web applications.',
    '₹5L – ₹20L/yr', '$75K – $120K/yr', '23% (Much faster)',
    'moderate', '4–10 months',
    ARRAY['HTML/CSS','JavaScript','React','Responsive Design','Git','APIs'],
    ARRAY['TypeScript','Next.js','Accessibility','Testing Library'],
    ARRAY['Frontend Mentor','Scrimba Frontend Path','freeCodeCamp','React Docs'],
    ARRAY['Startups','Product Companies','Agencies','Freelance'],
    ARRAY['Frontend Developer','UI Developer','React Developer','JavaScript Developer','Web Developer'],
    '🖥️', ARRAY['tech','coding','building','ui','frontend']
WHERE NOT EXISTS (SELECT 1 FROM career_paths WHERE title = 'Frontend Developer');

INSERT INTO career_paths (
    title, field, description, avg_salary_inr, avg_salary_usd, growth_rate,
    difficulty, time_to_entry, required_skills, nice_to_have_skills,
    recommended_courses, top_companies, job_roles, icon_emoji, quiz_tags
)
SELECT
    'Backend Developer', 'Technology',
    'Design APIs, business logic, and databases that power web and mobile products behind the scenes.',
    '₹6L – ₹24L/yr', '$80K – $130K/yr', '24% (Much faster)',
    'moderate', '6–12 months',
    ARRAY['Python or Node.js','REST APIs','SQL','Git','Authentication','System Design Basics'],
    ARRAY['Docker','Caching','Message Queues','GraphQL'],
    ARRAY['Node.js Docs','FastAPI Docs','CS50 API','Backend Engineering Blogs'],
    ARRAY['SaaS Companies','Fintech','Startups','Enterprise Teams'],
    ARRAY['Backend Developer','API Developer','Python Developer','Node.js Developer','Software Engineer'],
    '🧩', ARRAY['tech','coding','backend','apis','problem-solving']
WHERE NOT EXISTS (SELECT 1 FROM career_paths WHERE title = 'Backend Developer');

INSERT INTO career_paths (
    title, field, description, avg_salary_inr, avg_salary_usd, growth_rate,
    difficulty, time_to_entry, required_skills, nice_to_have_skills,
    recommended_courses, top_companies, job_roles, icon_emoji, quiz_tags
)
SELECT
    'AI / ML Engineer', 'Technology',
    'Train, deploy, and improve intelligent systems using machine learning, deep learning, and applied AI.',
    '₹8L – ₹32L/yr', '$100K – $155K/yr', '35% (Much faster)',
    'hard', '8–18 months',
    ARRAY['Python','Machine Learning','Deep Learning','Linear Algebra','SQL','Model Deployment'],
    ARRAY['MLOps','LLMs','PyTorch','Cloud ML'],
    ARRAY['Fast.ai','DeepLearning.AI','Kaggle Learn','Hands-On ML'],
    ARRAY['AI Startups','Research Labs','Big Tech','Product Companies'],
    ARRAY['ML Engineer','AI Engineer','Applied Scientist','MLOps Engineer','Research Engineer'],
    '🤖', ARRAY['tech','ai','machine-learning','data','research']
WHERE NOT EXISTS (SELECT 1 FROM career_paths WHERE title = 'AI / ML Engineer');

INSERT INTO career_paths (
    title, field, description, avg_salary_inr, avg_salary_usd, growth_rate,
    difficulty, time_to_entry, required_skills, nice_to_have_skills,
    recommended_courses, top_companies, job_roles, icon_emoji, quiz_tags
)
SELECT
    'QA / Automation Engineer', 'Technology',
    'Ensure software quality through manual testing, automation, bug tracking, and release confidence.',
    '₹4L – ₹16L/yr', '$65K – $105K/yr', '17% (Faster)',
    'moderate', '4–9 months',
    ARRAY['Manual Testing','Test Cases','Bug Reporting','Automation Basics','APIs','SQL'],
    ARRAY['Selenium','Playwright','CI/CD','Performance Testing'],
    ARRAY['ISTQB','Playwright Docs','Selenium Docs','Test Automation University'],
    ARRAY['Product Companies','QA Firms','Startups','Enterprise Teams'],
    ARRAY['QA Engineer','Automation Engineer','Software Test Engineer','SDET','Quality Analyst'],
    '✅', ARRAY['tech','testing','quality','problem-solving','automation']
WHERE NOT EXISTS (SELECT 1 FROM career_paths WHERE title = 'QA / Automation Engineer');

INSERT INTO career_paths (
    title, field, description, avg_salary_inr, avg_salary_usd, growth_rate,
    difficulty, time_to_entry, required_skills, nice_to_have_skills,
    recommended_courses, top_companies, job_roles, icon_emoji, quiz_tags
)
SELECT
    'Network Engineer', 'Technology',
    'Plan, secure, and maintain computer networks that keep organizations connected and online.',
    '₹4.5L – ₹18L/yr', '$70K – $115K/yr', '11% (Average)',
    'moderate', '6–12 months',
    ARRAY['Networking','TCP/IP','Routing & Switching','Linux','Network Security','Troubleshooting'],
    ARRAY['Cloud Networking','Firewalls','Wireless Networks','Python Automation'],
    ARRAY['Cisco CCNA','NetworkChuck','CompTIA Network+','Juniper Training'],
    ARRAY['Telecom Companies','Data Centers','MSPs','Enterprise IT'],
    ARRAY['Network Engineer','Network Administrator','NOC Engineer','Infrastructure Engineer','Systems Engineer'],
    '🌐', ARRAY['tech','networking','infrastructure','security','problem-solving']
WHERE NOT EXISTS (SELECT 1 FROM career_paths WHERE title = 'Network Engineer');

INSERT INTO career_paths (
    title, field, description, avg_salary_inr, avg_salary_usd, growth_rate,
    difficulty, time_to_entry, required_skills, nice_to_have_skills,
    recommended_courses, top_companies, job_roles, icon_emoji, quiz_tags
)
SELECT
    'Database Administrator', 'Technology',
    'Manage databases, optimize performance, protect backups, and keep critical data systems healthy.',
    '₹5L – ₹20L/yr', '$75K – $120K/yr', '12% (Average)',
    'moderate', '6–12 months',
    ARRAY['SQL','Database Design','Backups','Performance Tuning','Linux','Monitoring'],
    ARRAY['PostgreSQL','MySQL','Replication','Cloud Databases'],
    ARRAY['PostgreSQL Docs','Mode SQL','Database Design Courses','Oracle Learning'],
    ARRAY['Banks','SaaS Companies','Consulting Firms','Enterprise IT'],
    ARRAY['Database Administrator','Database Engineer','SQL Developer','Data Platform Engineer','Performance Tuning Specialist'],
    '🗄️', ARRAY['tech','data','sql','infrastructure','analysis']
WHERE NOT EXISTS (SELECT 1 FROM career_paths WHERE title = 'Database Administrator');

INSERT INTO career_paths (
    title, field, description, avg_salary_inr, avg_salary_usd, growth_rate,
    difficulty, time_to_entry, required_skills, nice_to_have_skills,
    recommended_courses, top_companies, job_roles, icon_emoji, quiz_tags
)
SELECT
    'IT Support / Systems Administrator', 'Technology',
    'Support users, maintain systems, manage devices, and keep day-to-day IT operations running smoothly.',
    '₹3L – ₹12L/yr', '$45K – $80K/yr', '9% (Average)',
    'easy', '3–6 months',
    ARRAY['Computer Hardware','Windows/Linux','Troubleshooting','Networking Basics','Documentation','Communication'],
    ARRAY['Active Directory','Ticketing Tools','PowerShell','Security Basics'],
    ARRAY['Google IT Support','CompTIA A+','Microsoft Learn','Help Desk Labs'],
    ARRAY['IT Services','Schools','Hospitals','Corporate IT Departments'],
    ARRAY['IT Support Specialist','System Administrator','Desktop Support Engineer','Technical Support Engineer','Helpdesk Analyst'],
    '🛠️', ARRAY['tech','support','systems','troubleshooting','communication']
WHERE NOT EXISTS (SELECT 1 FROM career_paths WHERE title = 'IT Support / Systems Administrator');

INSERT INTO career_paths (
    title, field, description, avg_salary_inr, avg_salary_usd, growth_rate,
    difficulty, time_to_entry, required_skills, nice_to_have_skills,
    recommended_courses, top_companies, job_roles, icon_emoji, quiz_tags
)
SELECT
    'Game Developer', 'Technology',
    'Create gameplay systems, mechanics, and interactive worlds for PC, console, and mobile games.',
    '₹5L – ₹22L/yr', '$70K – $125K/yr', '16% (Faster)',
    'hard', '8–18 months',
    ARRAY['C# or C++','Unity or Unreal','Game Physics','Problem-Solving','Math','Git'],
    ARRAY['Shaders','3D Math','Multiplayer','Game Design'],
    ARRAY['Unity Learn','Unreal Engine Docs','Brackeys','GameDev.tv'],
    ARRAY['Gaming Studios','Indie Teams','AR/VR Startups','Freelance'],
    ARRAY['Game Developer','Gameplay Programmer','Unity Developer','Unreal Developer','Game Programmer'],
    '🎮', ARRAY['tech','coding','games','creativity','building']
WHERE NOT EXISTS (SELECT 1 FROM career_paths WHERE title = 'Game Developer');
