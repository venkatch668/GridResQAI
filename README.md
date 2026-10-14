# GridResQ AI — Real-Time Electrical Grid Outage Intelligence & Emergency Operations Engine

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791.svg)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-24%20Passing-brightgreen.svg)]()

> **GridResQ** is an enterprise-grade AI-augmented operations center platform tailored for electrical distribution utilities (**TSSPDCL Hyderabad Metro**). It correlates SCADA/AMI electrical telemetry, inbound 1912 consumer calls, and field emergency squads to autonomously detect outages, isolate fault zones, predict root causes via bounded AI, and orchestrate rapid restoration.

---

## Table of Contents
1. [Architecture & System Design](#architecture--system-design)
2. [Technology Stack](#technology-stack)
3. [Key Features](#key-features)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup Guide](#installation--setup-guide)
   - [1. Backend Setup](#1-backend-setup)
   - [2. Database Setup (Supabase / Postgres / SQLite)](#2-database-setup)
   - [3. Frontend Setup](#3-frontend-setup)
6. [Configuration & Environment Variables](#configuration--environment-variables)
7. [Running the Application](#running-the-application)
8. [Automated Testing Suite](#automated-testing-suite)
9. [Operational Walkthrough](#operational-walkthrough)
10. [Documentation Links](#documentation-links)

---

## Architecture & System Design

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|  React 18 + TypeScript + Vite + TailwindCSS (High-Contrast Clean White Theme)    |
|  - Real-Time GIS Grid Topology Map                                              |
|  - Live 1912 Helpline & IVR Call Simulator                                      |
|  - Outage Incident Tickets Lifecycle & Dispatch Kanban                          |
|  - Emergency Fleets (Gangs) & Linemen Directory                                 |
|  - Gemini AI Bounded Diagnosis View                                             |
+---------------------------------------------------------------------------------+
                                      |   ^
        HTTP REST API Requests        |   | Persistent Server-Sent Events (SSE)
                                      v   |
+---------------------------------------------------------------------------------+
|                                BACKEND TIER                                     |
|  FastAPI + SQLAlchemy 2.0 Async/Sync ORM Engine                                 |
|  - /api/auth       : JWT Authentication & BCrypt Password Encryption            |
|  - /api/tickets    : Incident Ticket CRUD, Lineman Dispatch, Lifecycle          |
|  - /api/crews      : Section Gangs & Accountable Linemen Tracking               |
|  - /api/topology   : Substation, Feeder, DTR Telemetry & Fault Injection        |
|  - /api/telephony  : Inbound 1912 Helpline & Conversational Transcripts         |
|  - /api/diagnosis  : Gemini Evidence-Bounded Causal Outage Reasoner            |
|  - /api/realtime   : Async Broadcaster with SSE Event Stream                    |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                                PERSISTENCE TIER                                 |
|  PostgreSQL 14+ / Supabase Cloud DB  (Fallback: Zero-Dependency Local SQLite 3) |
|  - 13 Relational Tables with Foreign Keys, Check Constraints & Cascade Rules    |
|  - Complete TSSPDCL Cybercity Grid Topology Seed Data                           |
+---------------------------------------------------------------------------------+
```

---

## Technology Stack

- **Backend**:
  - Python 3.10+ / FastAPI 0.115+
  - SQLAlchemy 2.0 (Relational ORM)
  - Psycopg 3 (PostgreSQL driver with native connection pooling)
  - PyJWT & Passlib / BCrypt (Stateless token authentication)
  - Starlette StreamingResponse (Server-Sent Events)
- **Frontend**:
  - React 18.3 (Component-driven architecture)
  - TypeScript 5.5 (Strict type checking)
  - Vite 5.4 (Ultra-fast build and HMR toolchain)
  - Tailwind CSS 3.4 (Utility-first styling, standard light theme default)
  - Lucide React (Operations icons)
- **Database**:
  - PostgreSQL 14+ / Supabase Transaction Pooler (port 6543)
  - Built-in SQLite 3 engine for local offline testing
- **Testing**:
  - Python `unittest` + `fastapi.testclient.TestClient` (24/24 passing automated tests)

---

## Key Features

1. **SCADA & Feeder Topology Visualization**:
   - Real-time hierarchical grid view: 33/11kV Substations -> 11kV Radial Feeders -> 11kV/415V Distribution Transformers (DTRs) -> Consumer Smart Meters.
   - Interactive fault simulation: Inject transformer phase drops or breaker trips with live voltage telemetry.

2. **Inbound 1912 Consumer Helpline Simulation**:
   - Interactive customer helpline simulator mimicking Exotel/Twilio voice gateways.
   - Generates multi-turn audio transcripts with speaker identification (`AI_AGENT`, `CALLER`, `SYSTEM`).
   - Automatically matches caller phone numbers to consumer Unique Service Connection (USC) numbers and electrical assets.

3. **Incident Ticket Lifecycle & Lineman Dispatch**:
   - Full CRUD support: Create tickets (`OPEN`), assign crews or individual linemen (`IN_PROGRESS`), resolve with MTTR calculation (`RESOLVED`), customer persistent dispute reopening (`OPEN`), or escalate (`ESCALATED`).
   - Synchronized personnel states: Dispatched linemen automatically transition to `ASSIGNED` and revert to `AVAILABLE` on release.

4. **Gemini AI Bounded Root Cause Diagnosis**:
   - Generates non-hallucinatory, evidence-grounded hypotheses for power outages.
   - Enforces guardrails: Every hypothesis is corroborated with voltage readings, SCADA breaker flags, and customer audio signals.

5. **Live Server-Sent Events (SSE) Streaming**:
   - Zero-latency broadcast of topology alerts, ticket creations, and dispatch actions to all connected operator workstations.

---

## Prerequisites

- **Node.js**: `v18.0.0` or later
- **Python**: `3.10` or later
- **Package Managers**: `npm` (Node) and `pip` (Python)
- **Git**

---

## Installation & Setup Guide

### 1. Backend Setup

```bash
# 1. Navigate to the project root
cd GridResQ

# 2. Create and activate a Python virtual environment
# Windows (PowerShell):
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Linux / macOS:
python3 -m venv .venv
source .venv/bin/activate

# 3. Install backend dependencies
pip install -r server/requirements.txt
```

### 2. Database Setup

GridResQ supports both **Supabase / PostgreSQL** (production cloud) and **SQLite** (instant zero-dependency local).

#### Option A: PostgreSQL / Supabase (Default)
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and set your `DATABASE_URL`:
   ```ini
   DATABASE_URL=postgresql://postgres.<project_id>:<password>@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
   ```
3. Run the SQL schema and seed data directly in the Supabase SQL Editor:
   - Schema: `server/database/supabase_setup.sql`

#### Option B: Zero-Dependency Local SQLite
If no PostgreSQL database is available, initialize the local SQLite database in one command:
```bash
python server/database/init_db.py
```
This executes `schema_sqlite.sql` and populates all initial substations, feeders, DTRs, gangs, and linemen into `gridresq.db`.

### 3. Frontend Setup

```bash
# 1. Navigate to frontend directory
cd ui

# 2. Install frontend node modules
npm install

# 3. Verify production build
npm run build
```

---

## Configuration & Environment Variables

Copy `.env.example` to `.env`:

| Variable | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | No | `sqlite:///gridresq.db` | PostgreSQL connection string or SQLite path |
| `DEBUG` | No | `true` | Enables verbose SQL logging and error traces |
| `HOST` | No | `0.0.0.0` | Host interface for FastAPI server |
| `PORT` | No | `8000` | HTTP port for FastAPI server |
| `JWT_SECRET_KEY` | No | *Internal default* | Cryptographic key used to sign JWT session tokens |
| `EXOTEL_API_KEY` | No | `mock_key` | Telephony gateway credential (mocked) |
| `GEMINI_API_KEY` | No | *Optional* | Google Gemini API key for dynamic AI diagnoses |

---

## Running the Application

### Option 1: Run Backend and Frontend Concurrently

**Terminal 1 (Backend API & SSE Engine)**:
```bash
# Ensure virtual environment is active
.\.venv\Scripts\Activate.ps1
python -m uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation (Swagger UI) is available at: [http://localhost:8000/docs](http://localhost:8000/docs)  
Health Check: [http://localhost:8000/health](http://localhost:8000/health)

**Terminal 2 (Frontend React Application)**:
```bash
cd ui
npm run dev
```
Access the web application at: [http://localhost:3000](http://localhost:3000)

---

## Automated Testing Suite

GridResQ includes a comprehensive 24-test integration and unit test suite verifying health checks, authentication, ticket lifecycle, lineman dispatch, fault injection, telephony, and AI diagnosis.

```bash
# Execute the full automated test suite:
.\.venv\Scripts\python.exe -m unittest server/tests/test_api.py -v
```

**Expected Output**:
```
Ran 24 tests in 31.808s
OK (100% Pass Rate)
```

Refer to [TESTING_EVIDENCE.md](file:///c:/Venkat/ai-lead/python/GridResQ/TESTING_EVIDENCE.md) for the complete test case matrix, bug resolutions, and retesting logs.

---

## Application Routes & Navigation Map

The frontend utilizes standard client-side routing (`react-router-dom`) providing direct, bookmarkable URLs:

| Route Path | Module Name | Description | Access |
| :--- | :--- | :--- | :--- |
| `/login` | **Sign In / Officer Profile** | Official authentication, role verification, and session overview | Public / Authenticated |
| `/signup` | **Officer Registration** | Register new verified TSSPDCL department officer | Public |
| `/map` | **Grid Map & Hubs** | Interactive GIS topology: Substations, Feeders, DTRs & Meters | Protected |
| `/incidents` | **Incident Management** | Master-detail ticket triage, work log, and MTTR resolution | Protected |
| `/crews` | **Field Crews & Dispatch** | Section Gangs, 11-lineman roster, and direct fault dispatch | Protected |
| `/calls` | **Telephony & Live Calls** | Inbound 1912 customer helpline simulation & voice transcripts | Protected |
| `/diagnosis` | **Gemini AI Diagnosis** | Non-hallucinatory, evidence-grounded causal root cause engine | Protected |

---

## Operational Walkthrough

1. **Authentication** (`/login`):
   - Access [http://localhost:3000/login](http://localhost:3000/login).
   - Use pre-seeded credentials:
     - **Operator**: `ramesh.varma@tsspdcl.gov.in` / `Password123!`
     - **Engineer**: `srinivas.reddy@tsspdcl.gov.in` / `Password123!`
     - **Lineman**: `ramulu.k@tsspdcl.gov.in` / `Password123!`
   - Or click **Sign Up** (`/signup`) to create a new role-based account.

2. **Electrical Grid Telemetry & Fault Simulation** (`/map`):
   - Navigate to the **Grid Map & Hubs** view.
   - Select Feeder `F-07-CYBER` and Distribution Transformer `DTR-MDP-101`.
   - Click **Simulate Trip**: Watch secondary voltages drop to 0V and real-time SSE notifications propagate across the UI.

3. **1912 Helpline Inbound Call Simulator** (`/calls`):
   - Open the **Telephony & Live Calls** page.
   - Click **Simulate Consumer 1912 Call**: An automated call turn executes, verifying caller telephone, matching consumer USC `USC-5018820`, and generating conversational transcripts.

4. **Incident Resolution & Dispatch** (`/incidents`):
   - In the **Incidents** page, open ticket `INC-2026-08412`.
   - Click **Assign Field Technician**: Select `K. Ramulu` from the available crew dropdown.
   - Click **Resolve Incident**: Input resolution category (`Transformer 11kV HG Fuse Replaced`) and remarks to compute MTTR and restore normal status.

5. **Field Crews & Lineman Directory** (`/crews`):
   - Toggle between **Section Gangs** and **Individual Linemen (11)**.
   - Check real-time lineman states (`AVAILABLE`, `ASSIGNED`, `RESTING`) and dispatch closest technicians.

6. **Gemini AI Bounded Diagnosis** (`/diagnosis`):
   - Review causal hypotheses, confidence scores, and verified evidence tags.

---

## Documentation Links

- [Testing Evidence & QA Report (TESTING_EVIDENCE.md)](file:///c:/Venkat/ai-lead/python/GridResQ/TESTING_EVIDENCE.md)
- [Database Schema & SQL Catalog (DATABASE.md)](file:///c:/Venkat/ai-lead/python/GridResQ/DATABASE.md)
- [REST API & SSE Specification (API_DOCUMENTATION.md)](file:///c:/Venkat/ai-lead/python/GridResQ/API_DOCUMENTATION.md)
- [Environment Configuration Template (.env.example)](file:///c:/Venkat/ai-lead/python/GridResQ/.env.example)
