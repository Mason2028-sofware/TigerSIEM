
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

#Ran this in terminal to recognize modules: python -m pip install sqlalchemy python-dotenv psycopg2-binary fastapi uvicorn

# Load environment variables from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


def _normalize_database_url(raw_url: str | None) -> str:
    if not raw_url or not raw_url.strip():
        raise ValueError("DATABASE_URL is not configured")

    url = raw_url.strip()

    if url.startswith("postgres://"):
        url = "postgresql+psycopg2://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    elif "://" not in url:
        url = f"postgresql+psycopg2://{url}"

    return url


# Create the database engine
engine = create_engine(
    _normalize_database_url(os.getenv("DATABASE_URL")),
    pool_pre_ping=True,
)


# Test whether TigerData is reachable
def get_data():
    query = text("SELECT NOW() AS current_time")

    with engine.connect() as connection:
        row = connection.execute(query).one()

        return {
            "timestamp": row.current_time.isoformat()
        }


# Retrieve the latest SIEM events
def get_events(limit: int = 100):
    if not 1 <= limit <= 1000:
        raise ValueError("limit must be between 1 and 1000")

    query = text("""
    SELECT
        tag,
        time,
        data
    FROM public.tiger_raw_events_v2
    WHERE tag NOT LIKE 'simulation.%'
    ORDER BY time DESC
    LIMIT :limit
    
    """)

    with engine.connect() as connection:
        rows = connection.execute(query, {"limit": limit})

        return [
            {
                "tag": row.tag,
                "time": row.time.isoformat(),
                "data": row.data,
            }
            for row in rows
        ]


# Retrieve simplified SSH events
def get_ssh_events(limit: int = 100):
    if not 1 <= limit <= 1000:
        raise ValueError("limit must be between 1 and 1000")

    query = text("""
        SELECT
            time,
            tag,
            data->>'MESSAGE' AS message,
            data->>'_PID' AS process_id,
            data->>'_UID' AS user_id,
            data->>'_EXE' AS executable
        FROM public.tiger_raw_events_v2
        WHERE tag = 'target.ssh'
        ORDER BY time DESC
        LIMIT :limit
    """)

    with engine.connect() as connection:
        rows = connection.execute(query, {"limit": limit})

        return [
            {
                "time": row.time.isoformat(),
                "tag": row.tag,
                "message": row.message,
                "process_id": row.process_id,
                "user_id": row.user_id,
                "executable": row.executable,
            }
            for row in rows
        ]


# Calculate basic security statistics
def get_stats():
    query = text("""
    SELECT
        COUNT(*) AS total_events,
        COUNT(*) FILTER (
            WHERE
                data->>'MESSAGE' ILIKE '%failed password%'
                OR data->>'MESSAGE' ILIKE '%authentication failure%'
                OR data->>'MESSAGE' ILIKE '%password check failed%'
        ) AS failed_auth_events,
        COUNT(*) FILTER (
            WHERE tag = 'target.ssh'
        ) AS ssh_events,
        MAX(time) AS latest_event
    FROM public.tiger_raw_events_v2
    WHERE tag NOT LIKE 'simulation.%'
    """)

    with engine.connect() as connection:
        row = connection.execute(query).one()

        return {
            "total_events": row.total_events,
            "failed_auth_events": row.failed_auth_events,
            "ssh_events": row.ssh_events,
            "latest_event": (
                row.latest_event.isoformat()
                if row.latest_event else None
            ),
        }

def get_historical_stats():
    query = text("""
        SELECT
            time_bucket('1 day', time) AS day,
            COUNT(*) AS total_events,
            COUNT(*) FILTER (
                WHERE data->>'MESSAGE' ILIKE '%failed password%'
            ) AS failed_logins
        FROM public.tiger_raw_events_v2
        WHERE tag = 'simulation.ssh'
        GROUP BY day
        ORDER BY day DESC
    """)

    with engine.connect() as connection:
        rows = connection.execute(query).all()

        return [
            {
                "day": row.day.isoformat(),
                "total_events": row.total_events,
                "failed_logins": row.failed_logins
            }
            for row in rows
        ]
