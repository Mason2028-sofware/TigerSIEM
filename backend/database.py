import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


def _normalize_database_url(raw_url: str | None) -> str:
   if not raw_url or not raw_url.strip():
       return "sqlite:///./tiger_siem.db"

   url = raw_url.strip()

   if url.startswith("postgres://"):
       url = "postgresql+psycopg2://" + url[len("postgres://") :]
   elif url.startswith("postgresql://"):
       url = "postgresql+psycopg2://" + url[len("postgresql://") :]
   elif "://" not in url:
       url = f"postgresql+psycopg2://{url}"

   return url


engine = create_engine(
   _normalize_database_url(os.getenv("DATABASE_URL")),
   pool_pre_ping=True,
)


def get_data():
   query = text("SELECT NOW() AS current_time") if engine.dialect.name != "sqlite" else text("SELECT datetime('now') AS current_time")

   try:
       with engine.connect() as connection:
           row = connection.execute(query).fetchone()
           value = row[0] if row else None
           if hasattr(value, "isoformat"):
               value = value.isoformat()
           return {"timestamp": value}
   except Exception as exc:
       return {
           "timestamp": None,
           "error": str(exc),
           "database_url_configured": bool(os.getenv("DATABASE_URL")),
       }
