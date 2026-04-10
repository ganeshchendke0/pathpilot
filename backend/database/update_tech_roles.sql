-- Update existing PathPilot career records with broader Tech / IT role titles.

UPDATE career_paths
SET job_roles = ARRAY[
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Engineer',
    'Software Engineer',
    'Web Developer',
    'Application Developer'
]
WHERE title = 'Full Stack Developer';

UPDATE career_paths
SET job_roles = ARRAY[
    'Data Scientist',
    'Machine Learning Engineer',
    'Data Analyst',
    'AI Engineer',
    'Business Intelligence Analyst',
    'Research Scientist'
]
WHERE title = 'Data Scientist';

UPDATE career_paths
SET job_roles = ARRAY[
    'Product Manager',
    'Technical Project Manager',
    'Associate Product Manager',
    'Senior PM',
    'Head of Product'
]
WHERE title = 'Product Manager';

UPDATE career_paths
SET job_roles = ARRAY[
    'Cybersecurity Analyst',
    'SOC Analyst',
    'Penetration Tester',
    'Security Engineer',
    'Information Security Analyst',
    'Security Consultant'
]
WHERE title = 'Cybersecurity Analyst';

UPDATE career_paths
SET job_roles = ARRAY[
    'Mobile App Developer',
    'Application Developer',
    'iOS Developer',
    'Android Developer',
    'Flutter Developer',
    'React Native Developer'
]
WHERE title = 'Mobile App Developer';

UPDATE career_paths
SET job_roles = ARRAY[
    'DevOps Engineer',
    'Cloud Engineer',
    'Cloud Architect',
    'Site Reliability Engineer',
    'Platform Engineer',
    'Infrastructure Engineer'
]
WHERE title = 'Cloud & DevOps Engineer';
