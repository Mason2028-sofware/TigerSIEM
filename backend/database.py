
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

#Ran this in terminal to recognize modules: python -m pip install sqlalchemy python-dotenv psycopg2-binary fastapi uvicorn

from datetime import date, datetime, time, timedelta
from time import perf_counter
from statistics import median

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

def date_bounds(start_date: date | None, end_date: date | None):
    if start_date and end_date and start_date > end_date:
        raise ValueError("start_date cannot be after end_date")

    start = datetime.combine(start_date, time.min) if start_date else None

    end = (
        datetime.combine(end_date + timedelta(days=1), time.min)
        if end_date else None
    )

    return start, end


# Test whether TigerData is reachable
def get_data():
    query = text("SELECT NOW() AS current_time")

    with engine.connect() as connection:
        row = connection.execute(query).one()

        return {
            "timestamp": row.current_time.isoformat()
        }


# Retrieve the latest SIEM events
def get_events(
    limit: int = 100,
    start_date: date | None = None,
    end_date: date | None = None,
):
    if not 1 <= limit <= 1000:
        raise ValueError("limit must be between 1 and 1000")

    start, end = date_bounds(start_date, end_date)

    query = text("""
        SELECT tag, time, data
        FROM public.tiger_raw_events_v2
        WHERE tag NOT LIKE 'simulation.%'
          AND (:start_time IS NULL OR time >= :start_time)
          AND (:end_time IS NULL OR time < :end_time)
        ORDER BY time DESC
        LIMIT :limit
    """)

    with engine.connect() as connection:
        rows = connection.execute(query, {
            "limit": limit,
            "start_time": start,
            "end_time": end,
        }).all()

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


# Calculate current security statistics (exclude simulated events)
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

            COUNT(*) FILTER (
                WHERE tag = 'target.suricata'
                  AND data->>'event_type' = 'alert'
            ) AS network_alerts,

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
        "network_alerts": row.network_alerts,
        "latest_event": (
            row.latest_event.isoformat()
            if row.latest_event else None
        ),
    }


# Calculate daily historical SSH activity and network alerts
def get_historical_stats(
    start_date: date | None = None,
    end_date: date | None = None,
):
    start, end = date_bounds(start_date, end_date)

    query = text("""
        SELECT
            time_bucket('1 day', time) AS day,

            COUNT(*) FILTER (
                WHERE tag = 'simulation.ssh'
            ) AS total_events,

            COUNT(*) FILTER (
                WHERE tag = 'simulation.ssh'
                  AND data->>'MESSAGE' ILIKE '%failed password%'
            ) AS failed_logins,

            COUNT(*) FILTER (
                WHERE tag = 'target.suricata'
                  AND data->>'event_type' = 'alert'
            ) AS network_alerts

        FROM public.tiger_raw_events_v2

        WHERE tag IN ('simulation.ssh', 'target.suricata')
          AND (:start_time IS NULL OR time >= :start_time)
          AND (:end_time IS NULL OR time < :end_time)

        GROUP BY day
        ORDER BY day DESC
    """)

    with engine.connect() as connection:
        rows = connection.execute(
            query,
            {
                "start_time": start,
                "end_time": end,
            }
        ).all()

    return [
        {
            "day": row.day.isoformat(),
            "total_events": row.total_events,
            "failed_logins": row.failed_logins,
            "network_alerts": row.network_alerts,
        }
        for row in rows
    ]
def benchmark_historical(
    start_date: date | None = None,
    end_date: date | None = None,
):
    start, end = date_bounds(start_date, end_date)

    query = text("""
        SELECT
            time_bucket('1 day', time) AS day,
            COUNT(*) AS total_events,
            COUNT(*) FILTER (
                WHERE data->>'MESSAGE' ILIKE '%failed password%'
            ) AS failed_logins
        FROM public.tiger_raw_events_v2
        WHERE tag = 'simulation.ssh'
          AND (:start_time IS NULL OR time >= :start_time)
          AND (:end_time IS NULL OR time < :end_time)
        GROUP BY day
        ORDER BY day DESC
    """)

    params = {
        "start_time": start,
        "end_time": end,
    }

    timings = []
    days_returned = 0

    with engine.connect() as connection:
        # Warm-up query, excluded from measurements
        connection.execute(query, params).all()

        for _ in range(3):
            started = perf_counter()

            rows = connection.execute(query, params).all()

            elapsed_ms = (perf_counter() - started) * 1000

            timings.append(round(elapsed_ms, 3))
            days_returned = len(rows)

    return {
        "benchmark": "historical_daily_aggregation",
        "storage": "Hypercore-enabled hypertable",
        "runs": 3,
        "execution_times_ms": timings,
        "median_time_ms": round(median(timings), 3),
        "days_returned": days_returned,
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
    }

# Retrieve Suricata security alerts, including TCP SYN scans
def get_network_alerts(limit: int = 100):
    if not 1 <= limit <= 1000:
        raise ValueError("limit must be between 1 and 1000")

    query = text("""
        SELECT
            time,
            tag,
            data->>'src_ip' AS source_ip,
            data->>'dest_ip' AS destination_ip,
            data->>'dest_port' AS destination_port,
            data->'alert'->>'signature' AS alert,
            data->'alert'->>'severity' AS severity
        FROM public.tiger_raw_events_v2
        WHERE tag = 'target.suricata'
          AND data->>'event_type' = 'alert'
        ORDER BY time DESC
        LIMIT :limit
    """)

    with engine.connect() as connection:
        rows = connection.execute(query, {"limit": limit}).all()

        return [
            {
                "time": row.time.isoformat(),
                "tag": row.tag,
                "source_ip": row.source_ip,
                "destination_ip": row.destination_ip,
                "destination_port": row.destination_port,
                "alert": row.alert,
                "severity": row.severity,
            }
            for row in rows
        ]