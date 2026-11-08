# TigerSIEM

Tiger SIEM RF backend setup.

## Backend setup

1. Open a terminal in the `backend` directory.
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   . .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
3. Add your Timescale Cloud connection string to `backend/.env` as `DATABASE_URL`.
4. Start the API:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
5. Confirm the app is running:
   ```bash
   curl http://localhost:8000/
   curl http://localhost:8000/api/data
   ```

The backend accepts a `postgres://` or `postgresql://` URL from Timescale Cloud and normalizes it for SQLAlchemy before connecting.
