Act as an expert full-stack engineer and network automation specialist. 
We are building "Net Almoner", a commercial desktop network configuration backup and visual diff tool.

Goal: Create a clean, production-ready, modular MVP.

Target Stack:
- Backend: Python 3.11+, FastAPI, Netmiko (SSH), SQLite (via SQLAlchemy).
- Frontend: React (Vite), Tailwind CSS, shadcn/ui, Lucide React icons.
- App Wrapper: Tauri (for lightweight desktop distribution).

Core Features Required:
1. Device Management: CRUD operations for network devices (IP, hostname, vendor, credentials).
2. Backup Engine: Automated/manual SSH fetching of running configurations using Netmiko.
3. Git-style Diffing: Text comparison engine showing side-by-side configuration changes.
4. History Log: Database tracking timestamped backup versions per device.
5. Simple Dashboard: Visual health indicators, backup success rates, and recent change alerts.

Project Directory Structure:
net-almoner/
├── backend/
│   ├── app/
│   │   ├── core/ (config, database setup)
│   │   ├── models/ (SQLAlchemy models)
│   │   ├── schemas/ (Pydantic schemas)
│   │   ├── services/ (netmiko_ssh.py, diff_engine.py)
│   │   └── routers/ (devices.py, backups.py)
│   └── main.py
└── frontend/
    ├── src/
    │   ├── components/ (ui/, custom/)
    │   ├── hooks/
    │   └── App.jsx

Your Task:
Let's build this iteratively. Do not write all files at once. 
Start by generating the Backend Setup. 
Provide:
1. The requirements.txt file.
2. The SQLAlchemy database initialization code in backend/app/core/database.py.
3. The Device database model in backend/app/models/device.py.

Ensure code includes robust try/except blocks and clear variable names. Stop after completing these initial backend files and ask me for the next step.

env -u HTTP_PROXY -u http_proxy -u HTTPS_PROXY -u https_proxy 
npm run dev -- --host 0.0.0.0 --port 5173

.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --reload
(while building this product got a new idea
 to create a web app with a good ui to be able share files between pc and mobile which are using the same network)
 while running my npm run apps.... it shows an option where instead of opening on localhost only ... it has also a link that can be opened by any device in the same network.. hoping to tap into this technology to create the application

 (learn a way on how to bypass a workplace firewall)

 (
    Thought also about working on Kstream
 )
 git commit --allow-empty -m "Special exams postponed" --date="Mon August 10 01:14:00 2026"

