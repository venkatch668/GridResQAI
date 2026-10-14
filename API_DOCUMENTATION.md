# GridResQ Operations Engine — API Specification

**Base URL**: `http://localhost:8000`  
**API Prefix**: `/api`  
**Authentication**: Bearer Token via HTTP Header (`Authorization: Bearer <jwt_access_token>`)  
**Data Format**: `application/json` (unless SSE `text/event-stream`)  

---

## 1. System & Realtime Streaming

### 1.1 System Health
- **Endpoint**: `GET /health`
- **Auth**: None
- **Description**: Returns operational heartbeat and API version.
- **Response**: `200 OK`
```json
{
  "status": "healthy",
  "app": "GridResQ AI Operations Engine",
  "version": "2.4.0",
  "database": "connected"
}
```

### 1.2 Realtime Server-Sent Events (SSE) Stream
- **Endpoint**: `GET /api/realtime/stream`
- **Auth**: Optional / Anonymous
- **Response Type**: `text/event-stream`
- **Description**: Establishes a persistent SSE connection pushing live grid events (`ticket_created`, `ticket_updated`, `telemetry_updated`, `call_received`, `crew_dispatched`).
- **Sample Event**:
```http
event: ticket_updated
data: {"ticket_id": "tkt-001", "status": "IN_PROGRESS", "allocated_technician": "K. Ramulu"}
```

### 1.3 Realtime Broadcaster Status
- **Endpoint**: `GET /api/realtime/status`
- **Auth**: None
- **Response**: `200 OK`
```json
{
  "active_clients": 3,
  "status": "online",
  "timestamp": "2026-10-14T16:14:25.102Z"
}
```

---

## 2. Authentication & Authorization

### 2.1 User Registration
- **Endpoint**: `POST /api/auth/signup`
- **Auth**: None
- **Request Body**:
```json
{
  "full_name": "Ramesh Varma",
  "email": "ramesh.varma@tsspdcl.gov.in",
  "password": "Password123!",
  "role": "NOC_OPERATOR",
  "section_office": "Cybercity Division Operations NOC",
  "phone": "+91 94906 18001"
}
```
- **Responses**:
  - `201 Created`: Returns JWT token and sanitized user profile.
  - `400 Bad Request`: Email already exists.

### 2.2 User Login
- **Endpoint**: `POST /api/auth/login`
- **Auth**: None
- **Request Body**:
```json
{
  "email": "ramesh.varma@tsspdcl.gov.in",
  "password": "Password123!"
}
```
- **Responses**:
  - `200 OK`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "usr-op-842",
    "email": "ramesh.varma@tsspdcl.gov.in",
    "full_name": "Operator Ramesh Varma",
    "role": "NOC_OPERATOR",
    "section_office": "Cybercity Division Operations NOC"
  }
}
```
  - `401 Unauthorized`: Invalid credentials.

### 2.3 Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Auth**: Bearer Token
- **Response**: `200 OK` with user details.

---

## 3. Incident Ticket Management

### 3.1 List Incident Tickets
- **Endpoint**: `GET /api/tickets`
- **Auth**: Optional
- **Query Parameters**:
  - `status` (string, optional): `OPEN`, `IN_PROGRESS`, `RESOLVED`, `ESCALATED`
  - `priority` (string, optional): `P1_CRITICAL`, `P2_HIGH`, `P3_MEDIUM`, `P4_LOW`
- **Response**: `200 OK` (Array of ticket objects).

### 3.2 Create Incident Ticket
- **Endpoint**: `POST /api/tickets`
- **Auth**: Optional
- **Request Body**:
```json
{
  "substation_name": "Madhapur 33/11kV Substation",
  "section_office": "Madhapur Section, TSSPDCL",
  "primary_asset_type": "FEEDER",
  "primary_asset_code": "F-07-CYBER",
  "priority": "P1_CRITICAL",
  "summary": "11kV feeder tripped on overcurrent, 740 consumers affected",
  "locality": "Ayyappa Society, Madhapur",
  "consumers_affected": 740
}
```
- **Response**: `200 OK` with created ticket including generated `id` and `ticket_number`.

### 3.3 Dispatch Lineman to Ticket
- **Endpoint**: `POST /api/tickets/{id}/assign-technician`
- **Auth**: Optional
- **Request Body**:
```json
{
  "technician_id": "tech-mdp-1",
  "notes": "Dispatched for primary fuse replacement and line patrol"
}
```
- **Response**: `200 OK` (Sets ticket status to `IN_PROGRESS` and lineman status to `ASSIGNED`).

### 3.4 Append Work Comment
- **Endpoint**: `POST /api/tickets/{id}/comments`
- **Auth**: Optional
- **Request Body**:
```json
{
  "author": "Operator Ramesh Varma",
  "role": "OPERATOR",
  "content": "Line patrol in progress near DTR-101. Tree branch cleared from conductors."
}
```
- **Response**: `200 OK` with persisted comment including timestamp.

### 3.5 Resolve Incident Ticket
- **Endpoint**: `POST /api/tickets/{id}/resolve`
- **Auth**: Optional
- **Request Body**:
```json
{
  "resolution_category": "FUSE_REPLACEMENT",
  "resolution_reason": "Replaced blown 11kV HG horn-gap fuse on DTR-101; voltages normalized to 240V."
}
```
- **Response**: `200 OK` (Computes MTTR and sets status to `RESOLVED`).

### 3.6 Reopen Incident Ticket
- **Endpoint**: `POST /api/tickets/{id}/reopen`
- **Auth**: Optional
- **Request Body**:
```json
{
  "reason": "Consumer USC-10492817 reports phase drop persists on B-Phase."
}
```
- **Response**: `200 OK` (Reverts ticket status to `OPEN`).

### 3.7 Escalate Ticket
- **Endpoint**: `POST /api/tickets/{id}/escalate`
- **Auth**: Optional
- **Request Body**:
```json
{
  "reason": "Underground cable puncture requires specialized fault locator van from Central Stores."
}
```
- **Response**: `200 OK` (Sets status to `ESCALATED`).

---

## 4. Emergency Fleets & Linemen Personnel

### 4.1 List Section Gangs
- **Endpoint**: `GET /api/crews`
- **Response**: `200 OK` (Array of squad units with vehicle numbers, specialization, and ETA).

### 4.2 List Individual Linemen
- **Endpoint**: `GET /api/technicians`
- **Response**: `200 OK` (Array of technicians with contact numbers, roles, and duty status).

### 4.3 Release Lineman to Available
- **Endpoint**: `POST /api/technicians/{id}/release`
- **Response**: `200 OK` (Sets technician status from `ASSIGNED` to `AVAILABLE`).

---

## 5. Electrical Grid Topology & Fault Simulation

### 5.1 List Substations
- **Endpoint**: `GET /api/topology/substations`
- **Response**: `200 OK` (Substations tree with child feeders and connected DTRs).

### 5.2 List Distribution Transformers
- **Endpoint**: `GET /api/topology/transformers`
- **Query Parameters**:
  - `feeder_id` (string, optional)
- **Response**: `200 OK` (Array of DTRs with voltages, telemetry status, and coordinates).

### 5.3 Simulate Transformer Trip (Fault Injection)
- **Endpoint**: `POST /api/topology/transformers/{id}/simulate-trip`
- **Response**: `200 OK` (Sets DTR status to `FAILED`, trips secondary voltages to 0.0V, and broadcasts real-time SSE event).

---

## 6. Telephony Inbound Helpline & AI Diagnostics

### 6.1 Simulate Inbound 1912 Helpline Call
- **Endpoint**: `POST /api/telephony/simulate`
- **Request Body**:
```json
{
  "caller_phone": "+91 98490 88210",
  "locality": "Madhapur, Hyderabad",
  "matched_usc_number": "USC-5018820",
  "issue_description": "Complete blackout observed since 15 minutes, transformer spark heard near DTR-04."
}
```
- **Response**: `200 OK` (Returns call session ID and creates multi-turn transcript).

### 6.2 Get Recent Telephony Calls
- **Endpoint**: `GET /api/telephony/calls`
- **Response**: `200 OK` (Array of recent call logs with chronological transcript turns).

### 6.3 AI Root Cause Diagnosis
- **Endpoint**: `GET /api/diagnosis/{ticket_id}`
- **Description**: Generates an evidence-bounded causal diagnosis hypothesis powered by Gemini.
- **Response**: `200 OK`
```json
{
  "ticket_id": "tkt-001",
  "scenario_key": "DTR_BLOWN_FUSE",
  "primary_hypothesis_title": "Primary 11kV Horn-Gap (HG) Fuse Failure on Phase R",
  "confidence_score": 94.5,
  "description": "Zero secondary phase voltage observed concurrent with consumer audio telemetry reporting electrical spark.",
  "evidence_tags": ["Zero Secondary Voltage", "Spark Sound Reported", "Feeder Load Spike"],
  "recommended_verification": [
    "Perform PTW (Permit-to-Work) de-energization on Feeder F-07.",
    "Inspect physical HG fuse elements for melting or carbon tracking."
  ],
  "guardrails_applied": ["Safety isolation protocol validated", "Non-hallucinatory evidence grounding"]
}
```

