# GridResQ - FastAPI Backend & Database Architecture

Operational Outage Management & Lineman Dispatch Server for TSSPDCL Cybercity Division, Hyderabad.

---

## 1. Quick Start

### Option A: Local SQLite (Zero Setup Required)
The local SQLite database (`gridresq.db`) is already generated and populated. To re-seed at any time:
```bash
# 1. Activate venv or run using python in .venv:
.venv\Scripts\python.exe server\database\init_db.py

# 2. Start the FastAPI server:
.venv\Scripts\python.exe -m uvicorn server.main:app --reload --port 8000
```

### Option B: Supabase (PostgreSQL Cloud)
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Open [server/database/supabase_setup.sql](file:///c:/Venkat/ai-lead/python/GridResQ/server/database/supabase_setup.sql).
3. Paste the contents into the Supabase SQL Editor and click **Run**.
4. In your `.env` file (or terminal), provide your Supabase connection string:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
5. Start the FastAPI server:
   ```bash
   .venv\Scripts\python.exe -m uvicorn server.main:app --reload --port 8000
   ```

---

## 2. API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & active database connection |
| `POST` | `/api/auth/login` | Authenticate with email/password and receive JWT Bearer token |
| `POST` | `/api/auth/signup` | Register a new TSSPDCL Officer / Lineman account |
| `GET` | `/api/auth/me` | Fetch authenticated officer profile |
| `GET` | `/api/tickets` | List incident tickets with status/priority/search filters |

| `POST` | `/api/tickets` | Create a new outage incident ticket |
| `GET` | `/api/tickets/{id}` | Get ticket details and activity comments |
| `POST` | `/api/tickets/{id}/assign-technician` | **Assign individual lineman technician** to ticket |
| `POST` | `/api/tickets/{id}/resolve` | Resolve ticket with root cause category & remarks |
| `POST` | `/api/tickets/{id}/reopen` | Reopen ticket |
| `POST` | `/api/tickets/{id}/escalate` | Escalate ticket to Divisional Engineer |
| `POST` | `/api/tickets/{id}/comments` | Add operator / field comment to ticket |
| `GET` | `/api/crews` | List Section Gangs (fleet status, location, vehicles) |
| `GET` | `/api/technicians` | List individual Linemen (status, phone, avatar, skills) |
| `POST` | `/api/technicians/{id}/assign` | Dispatch lineman to ticket |
| `POST` | `/api/technicians/{id}/release` | Mark lineman available / resting |
| `GET` | `/api/topology/substations` | List 33/11kV substations, feeders, and transformers |
| `GET` | `/api/topology/transformers` | List Distribution Transformers (DTRs) |
| `POST` | `/api/topology/transformers/{id}/simulate-trip` | Trigger fault / trip on transformer |
| `GET` | `/api/telephony/calls` | Recent 1912 IVR helpline call sessions & transcripts (Mock) |
| `POST` | `/api/telephony/simulate` | Simulate incoming 1912 customer call |
| `GET` | `/api/diagnosis/{ticket_id}` | AI Causal root cause diagnosis (Mock) |
| `GET` | `/api/realtime/stream` | **Server-Sent Events (SSE)** live push stream |

Interactive Swagger documentation is available at: **`http://localhost:8000/docs`**

