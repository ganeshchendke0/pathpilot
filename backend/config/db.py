import psycopg2
import psycopg2.extras
from config import Config

def get_connection():
    return psycopg2.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        dbname=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD
    )

def query(sql, params=None, fetch="all"):
    conn = get_connection()
    try:
        with conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, params)
                if fetch == "all":
                    return [dict(r) for r in cur.fetchall()]
                elif fetch == "one":
                    row = cur.fetchone()
                    return dict(row) if row else None
                return None
    finally:
        conn.close()

def execute(sql, params=None):
    conn = get_connection()
    try:
        with conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, params)
                try:
                    row = cur.fetchone()
                    return dict(row) if row else None
                except Exception:
                    return None
    finally:
        conn.close()