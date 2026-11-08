
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from database import (
    get_data,
    get_events,
    get_ssh_events,
    get_stats,
    get_historical_stats,
)

app = FastAPI(
    title="TigerSIEM Backend",
    description="Security event monitoring and historical analytics powered by TigerData",
    version="1.0.0",
)

# Allow the React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Backend health check
@app.get("/")
def home():
    return {"message": "TigerSIEM backend running"}


# Verify TigerData connection
@app.get("/api/data")
def get_database_data():
    try:
        return {
            "success": True,
            "data": get_data(),
        }
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database temporarily unavailable",
        )


# Retrieve recent real security events
@app.get("/api/events")
def events(limit: int = Query(default=100, ge=1, le=1000)):
    try:
        return {
            "success": True,
            "data": get_events(limit),
        }
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve security events",
        )


# Retrieve recent SSH security events
@app.get("/api/ssh")
def ssh_events(limit: int = Query(default=100, ge=1, le=1000)):
    try:
        return {
            "success": True,
            "data": get_ssh_events(limit),
        }
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve SSH events",
        )


# Retrieve live security statistics
@app.get("/api/stats")
def stats():
    try:
        return {
            "success": True,
            "data": get_stats(),
        }
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve security statistics",
        )


# Retrieve historical security analytics
# Queries simulated data across TigerData's hybrid storage
@app.get("/api/historical-stats")
def historical_stats():
    try:
        return {
            "success": True,
            "data": get_historical_stats(),
            "simulated": True,
        }
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve historical analytics",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
