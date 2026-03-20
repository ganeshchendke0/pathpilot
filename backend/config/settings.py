import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DB_HOST     = os.getenv("DB_HOST", "localhost")
    DB_PORT     = os.getenv("DB_PORT", "5433")
    DB_NAME     = os.getenv("DB_NAME", "pathpilot_db")
    DB_USER     = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
    SECRET_KEY  = os.getenv("SECRET_KEY", "pathpilot_dev_secret_change_in_prod")
    JWT_EXPIRY  = int(os.getenv("JWT_EXPIRY_HOURS", 24))
    DEBUG       = os.getenv("DEBUG", "True") == "True"
    PORT        = int(os.getenv("PORT", 5000))