#!/usr/bin/env python3
"""Database initialization script for PathPilot."""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "pathpilot_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

def run_sql_file(conn, filename):
    """Execute SQL commands from a file."""
    try:
        with open(filename, 'r') as f:
            sql = f.read()
        
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
        print(f"✓ Executed {filename}")
    except Exception as e:
        print(f"✗ Error executing {filename}: {e}")
        raise

def main():
    try:
        import psycopg2
    except ImportError:
        print("❌ psycopg2 not installed. Run: pip install psycopg2-binary")
        sys.exit(1)

    try:
        # Connect to PostgreSQL
        print(f"Connecting to PostgreSQL ({DB_HOST}:{DB_PORT})...")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD
        )
        
        # Create database if it doesn't exist
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
            if not cur.fetchone():
                print(f"Creating database '{DB_NAME}'...")
                cur.execute(f"CREATE DATABASE {DB_NAME}")
                print(f"✓ Database '{DB_NAME}' created")
            else:
                print(f"✓ Database '{DB_NAME}' exists")
        
        conn.close()
        
        # Connect to the new database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        
        # Run schema
        print("Setting up database schema...")
        run_sql_file(conn, "database/schema.sql")
        
        # Run seed data
        print("Seeding database...")
        run_sql_file(conn, "database/seed.sql")
        
        conn.close()
        print("✅ Database initialized successfully!")
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ Cannot connect to PostgreSQL: {e}")
        print(f"\nMake sure PostgreSQL is running on {DB_HOST}:{DB_PORT}")
        print("Windows users: Start PostgreSQL service from Services or pgAdmin")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
