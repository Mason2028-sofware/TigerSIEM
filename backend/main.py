
from datetime import date

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from database import (
    get_data,
    get_events,
    get_ssh_events,
    get_stats,
    get_historical_stats,
    benchmark_historical,
    get_network_alerts,
)


# Initialize FastAPI
app = FastAPI(
    title="TigerSIEM Backend",
    description="Security event monitoring and historical analytics powered by TigerData",
    version="1.0.0",
)


# Allow React frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Validate calendar date ranges
def validate_dates(start_date: date | None, end_date: date | None):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date cannot be after end_date",
        )


# Handle database errors consistently
def database_error(error):
    print(f"Database error: {error}")
    raise HTTPException(
        status_code=503,
        detail="Unable to retrieve data from TigerData",
    ) from error


# Home / health check
@app.get("/")
def home():
    return {
        "success": True,
        "message": "TigerSIEM backend running",
    }


# Test TigerData connectivity
@app.get("/api/data")
def get_database_data():
    try:
        return {
            "success": True,
            "data": get_data(),
        }
    except SQLAlchemyError as error:
        database_error(error)


# Retrieve recent security events
# Optional calendar date filtering
@app.get("/api/events")
def events(
    limit: int = Query(default=100, ge=1, le=1000),
    start_date: date | None = None,
    end_date: date | None = None,
):
    validate_dates(start_date, end_date)

    try:
        return {
            "success": True,
            "data": get_events(
                limit=limit,
                start_date=start_date,
                end_date=end_date,
            ),
        }
    except SQLAlchemyError as error:
        database_error(error)


# Retrieve SSH-specific security events
@app.get("/api/ssh")
def ssh_events(
    limit: int = Query(default=100, ge=1, le=1000),
):
    try:
        return {
            "success": True,
            "data": get_ssh_events(limit),
        }
    except SQLAlchemyError as error:
        database_error(error)


# Retrieve live security statistics
# Simulated historical events are excluded in database.py
@app.get("/api/stats")
def stats():
    try:
        return {
            "success": True,
            "data": get_stats(),
        }
    except SQLAlchemyError as error:
        database_error(error)


# Retrieve historical security analytics
# Supports calendar date filtering
@app.get("/api/historical-stats")
def historical_stats(
    start_date: date | None = None,
    end_date: date | None = None,
):
    validate_dates(start_date, end_date)

    try:
        return {
            "success": True,
            "data": get_historical_stats(
                start_date=start_date,
                end_date=end_date,
            ),
            "simulated": True,
        }
    except SQLAlchemyError as error:
        database_error(error)


# Benchmark historical analytics query performance
# Measures query and result-fetch time on TigerData
@app.get("/api/benchmark")
def benchmark(
    start_date: date | None = None,
    end_date: date | None = None,
):
    validate_dates(start_date, end_date)

    try:
        return {
            "success": True,
            "data": benchmark_historical(
                start_date=start_date,
                end_date=end_date,
            ),
        }
    except SQLAlchemyError as error:
        database_error(error)

@app.get("/api/network-alerts")
def network_alerts_api(limit: int = Query(default=100, ge=1, le=1000)):
    try:
        return {
            "success": True,
            "data": get_network_alerts(limit),
        }
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve network security alerts",
        )

# Start development server
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
