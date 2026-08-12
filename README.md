# Net Almoner

Net Almoner is a network configuration backup and diff tool with a FastAPI backend and a React + Vite frontend.

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+ (or newer)
- pip

## Backend

1. Open a terminal and go to the backend folder:

```bash
cd backend
```

2. Create and activate a Python virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Run the FastAPI server:

```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will be available at `http://127.0.0.1:8000`.

### Notes

- The app uses SQLite via SQLAlchemy, and database tables are initialized automatically when the server starts.
- CORS is configured to allow requests from `http://localhost:5173` and `http://127.0.0.1:5173`.

## Frontend

1. Open a terminal and go to the frontend folder:

```bash
cd frontend
```

2. Install frontend dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev -- --host 0.0.0.0
```

The frontend will run at `http://localhost:5173` by default.

### Notes

- Using `--host 0.0.0.0` enables access from other devices on the same local network if your machine's firewall allows it.
- If the backend is running at `127.0.0.1:8000`, the frontend should be able to connect to it from the browser on the same machine.

## Running tests

From the `backend` folder, run:

```bash
pytest
```

## Useful commands

- Start backend: `uvicorn main:app --host 127.0.0.1 --port 8000 --reload`
- Start frontend: `npm run dev -- --host 0.0.0.0`
- Build frontend: `npm run build`
- Preview built frontend: `npm run preview`

## Project structure

- `backend/` - FastAPI backend, SQLAlchemy models, routers, and services
- `frontend/` - React + Vite frontend
