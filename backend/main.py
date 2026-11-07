from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import get_data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Backend running"}


@app.get("/api/data")
def get_database_data():
    timestamp = get_data()

    # Your application logic goes here

    return {
        "success": True,
        "data": timestamp,
    }