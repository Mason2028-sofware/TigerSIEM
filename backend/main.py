from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import get_data

app = FastAPI(title="TigerSIEM Backend")

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
    return {
        "success": True,
        "data": get_data(),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
