-- ==============================================================================
-- GridResQ AI — SQLite Zero-Install Database Schema & Seed Data
-- ==============================================================================

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS call_transcript_segments;
DROP TABLE IF EXISTS telephony_calls;
DROP TABLE IF EXISTS ai_diagnoses;
DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS incident_tickets;
DROP TABLE IF EXISTS linemen_technicians;
DROP TABLE IF EXISTS section_gangs;
DROP TABLE IF EXISTS service_connections;
DROP TABLE IF EXISTS distribution_transformers;
DROP TABLE IF EXISTS feeders;
DROP TABLE IF EXISTS substations;

-- 1. Substations
CREATE TABLE substations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    voltage_kv TEXT NOT NULL DEFAULT '33/11kV',
    circle TEXT NOT NULL DEFAULT 'Cybercity Circle',
    division TEXT NOT NULL DEFAULT 'Gachibowli Division',
    section_office TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'HEALTHY',
    peak_load_mva REAL DEFAULT 28.5,
    incoming_lines_count INTEGER DEFAULT 2,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Feeders
CREATE TABLE feeders (
    id TEXT PRIMARY KEY,
    substation_id TEXT NOT NULL REFERENCES substations(id) ON DELETE CASCADE,
    feeder_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    locality TEXT NOT NULL,
    voltage_kv REAL NOT NULL DEFAULT 11.0,
    breaker_status TEXT NOT NULL DEFAULT 'CLOSED',
    simulated_state TEXT NOT NULL DEFAULT 'HEALTHY',
    load_amps REAL DEFAULT 145.0,
    connected_dtrs_count INTEGER NOT NULL DEFAULT 0,
    connected_meters_count INTEGER NOT NULL DEFAULT 0,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    route_coordinates TEXT DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Distribution Transformers
CREATE TABLE distribution_transformers (
    id TEXT PRIMARY KEY,
    feeder_id TEXT NOT NULL REFERENCES feeders(id) ON DELETE CASCADE,
    dtr_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    capacity_kva INTEGER NOT NULL,
    primary_voltage_v INTEGER NOT NULL DEFAULT 11000,
    secondary_voltage_v TEXT NOT NULL DEFAULT '415V/240V',
    simulated_state TEXT NOT NULL DEFAULT 'HEALTHY',
    telemetry_status TEXT NOT NULL DEFAULT 'Nominal (240V Phase-Neutral)',
    voltage_r REAL DEFAULT 240.0,
    voltage_y REAL DEFAULT 241.0,
    voltage_b REAL DEFAULT 239.0,
    neutral_voltage REAL DEFAULT 1.5,
    consumers_affected INTEGER NOT NULL DEFAULT 0,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Service Connections
CREATE TABLE service_connections (
    id TEXT PRIMARY KEY,
    usc_number TEXT NOT NULL UNIQUE,
    dtr_id TEXT NOT NULL REFERENCES distribution_transformers(id) ON DELETE CASCADE,
    consumer_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    premise_address TEXT NOT NULL,
    locality TEXT NOT NULL,
    tariff_category TEXT NOT NULL DEFAULT 'LT-I(A) Domestic',
    contracted_load_kw REAL DEFAULT 5.0,
    smart_meter_id TEXT UNIQUE,
    meter_status TEXT NOT NULL DEFAULT 'ENERGIZED',
    last_heartbeat_at TEXT DEFAULT (datetime('now')),
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Section Gangs
CREATE TABLE section_gangs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    section_office TEXT NOT NULL,
    specialization TEXT NOT NULL,
    specialization_label TEXT NOT NULL,
    vehicle_number TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    base_depot TEXT NOT NULL,
    current_location_text TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    speed_kmph INTEGER NOT NULL DEFAULT 0,
    eta_minutes INTEGER NOT NULL DEFAULT 8,
    lead_name TEXT NOT NULL,
    lead_phone TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    assigned_incident_id TEXT,
    assigned_ticket_number TEXT,
    assigned_task_description TEXT,
    assigned_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. Linemen & Technicians
CREATE TABLE linemen_technicians (
    id TEXT PRIMARY KEY,
    gang_id TEXT NOT NULL REFERENCES section_gangs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT NOT NULL,
    avatar_initials TEXT NOT NULL,
    experience_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    assigned_ticket_id TEXT,
    assigned_ticket_number TEXT,
    assigned_task_description TEXT,
    assigned_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Incident Tickets
CREATE TABLE incident_tickets (
    id TEXT PRIMARY KEY,
    ticket_number TEXT NOT NULL UNIQUE,
    service_connection_no TEXT,
    service_connection_id TEXT REFERENCES service_connections(id) ON DELETE SET NULL,
    substation_id TEXT REFERENCES substations(id) ON DELETE SET NULL,
    substation_name TEXT NOT NULL,
    section_office TEXT NOT NULL,
    primary_asset_type TEXT NOT NULL DEFAULT 'FEEDER',
    primary_asset_code TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'P2_HIGH',
    status TEXT NOT NULL DEFAULT 'OPEN',
    summary TEXT NOT NULL,
    locality TEXT NOT NULL,
    consumers_affected INTEGER NOT NULL DEFAULT 0,
    
    allocated_technician_id TEXT REFERENCES linemen_technicians(id) ON DELETE SET NULL,
    assigned_technician_name TEXT,
    assigned_technician_role TEXT,
    assigned_technician_phone TEXT,

    allocated_crew_id TEXT REFERENCES section_gangs(id) ON DELETE SET NULL,
    assigned_crew_name TEXT,
    assigned_crew_lead TEXT,
    assigned_crew_vehicle TEXT,
    assigned_crew_phone TEXT,

    assigned_operator_name TEXT DEFAULT 'Operator Ramesh Varma (ID: OP-842)',

    acknowledgement_channel TEXT DEFAULT 'SMS / EMAIL',
    acknowledgement_status TEXT DEFAULT 'SENT',
    recipient_contact TEXT,

    resolution_category TEXT,
    resolution_reason TEXT,
    duration_text TEXT,
    mttr_minutes INTEGER,
    resolved_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Comments
CREATE TABLE ticket_comments (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES incident_tickets(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 9. Telephony Calls
CREATE TABLE telephony_calls (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'exotel_mock',
    provider_call_id TEXT UNIQUE,
    caller_phone TEXT NOT NULL,
    dialed_number TEXT NOT NULL DEFAULT '1912',
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    matched_hub_id TEXT REFERENCES feeders(id) ON DELETE SET NULL,
    matched_usc_number TEXT,
    ticket_id TEXT REFERENCES incident_tickets(id) ON DELETE SET NULL,
    locality TEXT,
    duration_seconds INTEGER DEFAULT 45,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10. Call Transcript Segments
CREATE TABLE call_transcript_segments (
    id TEXT PRIMARY KEY,
    call_id TEXT NOT NULL REFERENCES telephony_calls(id) ON DELETE CASCADE,
    sequence_no INTEGER NOT NULL,
    speaker TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp_offset TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 11. AI Diagnoses
CREATE TABLE ai_diagnoses (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES incident_tickets(id) ON DELETE CASCADE,
    scenario_key TEXT NOT NULL,
    primary_hypothesis_title TEXT NOT NULL,
    confidence_score REAL NOT NULL DEFAULT 95.0,
    description TEXT NOT NULL,
    evidence_tags TEXT NOT NULL DEFAULT '[]',
    recommended_verification TEXT NOT NULL DEFAULT '[]',
    guardrails_applied TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. Audit Logs
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

