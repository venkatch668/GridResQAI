-- ==============================================================================
-- GridResQ AI — TSSPDCL Hyderabad Metro Operations Center Database Schema
-- Compatible with: Supabase / PostgreSQL 14+ / TimescaleDB
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean previous tables if running as a fresh migration
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS call_transcript_segments CASCADE;
DROP TABLE IF EXISTS telephony_calls CASCADE;
DROP TABLE IF EXISTS ai_diagnoses CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS incident_tickets CASCADE;
DROP TABLE IF EXISTS linemen_technicians CASCADE;
DROP TABLE IF EXISTS section_gangs CASCADE;
DROP TABLE IF EXISTS service_connections CASCADE;
DROP TABLE IF EXISTS distribution_transformers CASCADE;
DROP TABLE IF EXISTS feeders CASCADE;
DROP TABLE IF EXISTS substations CASCADE;

-- ==============================================================================
-- DOMAIN 1: ELECTRICAL GRID TOPOLOGY (GIS & HIERARCHY)
-- ==============================================================================

-- 1.1 Primary 33/11kV Substations
CREATE TABLE substations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    voltage_kv VARCHAR(32) NOT NULL DEFAULT '33/11kV',
    circle VARCHAR(128) NOT NULL DEFAULT 'Cybercity Circle',
    division VARCHAR(128) NOT NULL DEFAULT 'Gachibowli Division',
    section_office VARCHAR(128) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'HEALTHY' CHECK (status IN ('HEALTHY', 'DEGRADED', 'DOWN', 'MAINTENANCE')),
    peak_load_mva NUMERIC(6, 2) DEFAULT 28.5,
    incoming_lines_count INT DEFAULT 2,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 11kV Radial Distribution Feeders (Hubs)
CREATE TABLE feeders (
    id VARCHAR(64) PRIMARY KEY,
    substation_id VARCHAR(64) NOT NULL REFERENCES substations(id) ON DELETE CASCADE,
    feeder_code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    locality VARCHAR(255) NOT NULL,
    voltage_kv NUMERIC(4, 1) NOT NULL DEFAULT 11.0,
    breaker_status VARCHAR(32) NOT NULL DEFAULT 'CLOSED' CHECK (breaker_status IN ('CLOSED', 'TRIPPED', 'OPEN', 'LOCKOUT')),
    simulated_state VARCHAR(32) NOT NULL DEFAULT 'HEALTHY' CHECK (simulated_state IN ('HEALTHY', 'DEGRADED', 'DOWN', 'MAINTENANCE', 'OVERLOAD', 'TRIPPED')),
    load_amps NUMERIC(6, 2) DEFAULT 145.0,
    connected_dtrs_count INT NOT NULL DEFAULT 0,
    connected_meters_count INT NOT NULL DEFAULT 0,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    route_coordinates JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 11kV/415V Distribution Transformers (DTRs)
CREATE TABLE distribution_transformers (
    id VARCHAR(64) PRIMARY KEY,
    feeder_id VARCHAR(64) NOT NULL REFERENCES feeders(id) ON DELETE CASCADE,
    dtr_code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    capacity_kva INT NOT NULL CHECK (capacity_kva IN (63, 100, 160, 250, 315, 500)),
    primary_voltage_v INT NOT NULL DEFAULT 11000,
    secondary_voltage_v VARCHAR(32) NOT NULL DEFAULT '415V/240V',
    simulated_state VARCHAR(32) NOT NULL DEFAULT 'HEALTHY' CHECK (simulated_state IN ('HEALTHY', 'DEGRADED', 'DOWN', 'MAINTENANCE', 'OVERLOAD', 'PHASE_DROP', 'FAILED')),
    telemetry_status VARCHAR(255) NOT NULL DEFAULT 'Nominal (240V Phase-Neutral)',

    voltage_r NUMERIC(5, 1) DEFAULT 240.0,
    voltage_y NUMERIC(5, 1) DEFAULT 241.0,
    voltage_b NUMERIC(5, 1) DEFAULT 239.0,
    neutral_voltage NUMERIC(4, 1) DEFAULT 1.5,
    consumers_affected INT NOT NULL DEFAULT 0,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 Consumer Premises & Service Connections (USC Endpoints)
CREATE TABLE service_connections (
    id VARCHAR(64) PRIMARY KEY,
    usc_number VARCHAR(64) NOT NULL UNIQUE,
    dtr_id VARCHAR(64) NOT NULL REFERENCES distribution_transformers(id) ON DELETE CASCADE,
    consumer_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(32) NOT NULL,
    premise_address TEXT NOT NULL,
    locality VARCHAR(255) NOT NULL,
    tariff_category VARCHAR(64) NOT NULL DEFAULT 'LT-I(A) Domestic',
    contracted_load_kw NUMERIC(5, 2) DEFAULT 5.0,
    smart_meter_id VARCHAR(64) UNIQUE,
    meter_status VARCHAR(32) NOT NULL DEFAULT 'ENERGIZED' CHECK (meter_status IN ('ENERGIZED', 'POWER_FAIL', 'TAMPER', 'OFFLINE')),
    last_heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- DOMAIN 2: FIELD EMERGENCY CREWS FLEET & INDIVIDUAL TECHNICIANS
-- ==============================================================================

-- 2.1 Section Emergency Gangs (Squad Units & Fleet Vehicles)
CREATE TABLE section_gangs (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(128) NOT NULL,
    section_office VARCHAR(128) NOT NULL,
    specialization VARCHAR(64) NOT NULL CHECK (specialization IN ('HIGH_VOLTAGE_11KV', 'TRANSFORMER_DTR_BREAKDOWN', 'FUSE_OFF_CALL', 'UNDERGROUND_CABLE')),
    specialization_label VARCHAR(255) NOT NULL,
    vehicle_number VARCHAR(64) NOT NULL,
    vehicle_type VARCHAR(255) NOT NULL,
    base_depot VARCHAR(255) NOT NULL,
    current_location_text VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'DISPATCHED', 'ON_SITE', 'STANDBY')),
    speed_kmph INT NOT NULL DEFAULT 0,
    eta_minutes INT NOT NULL DEFAULT 8,
    lead_name VARCHAR(255) NOT NULL,
    lead_phone VARCHAR(32) NOT NULL,
    contact_phone VARCHAR(32) NOT NULL,
    assigned_incident_id VARCHAR(64),
    assigned_ticket_number VARCHAR(64),
    assigned_task_description TEXT,
    assigned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Individual Linemen & Field Engineers (Accountable Personnel)
CREATE TABLE linemen_technicians (
    id VARCHAR(64) PRIMARY KEY,
    gang_id VARCHAR(64) NOT NULL REFERENCES section_gangs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(128) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    avatar_initials VARCHAR(8) NOT NULL,
    experience_text VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ASSIGNED', 'RESTING')),
    assigned_ticket_id VARCHAR(64),
    assigned_ticket_number VARCHAR(64),
    assigned_task_description TEXT,
    assigned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- DOMAIN 3: INCIDENT MANAGEMENT & TICKETS
-- ==============================================================================

-- 3.1 Incident Tickets
CREATE TABLE incident_tickets (
    id VARCHAR(64) PRIMARY KEY,
    ticket_number VARCHAR(64) NOT NULL UNIQUE,
    service_connection_no VARCHAR(64),
    service_connection_id VARCHAR(64) REFERENCES service_connections(id) ON DELETE SET NULL,
    substation_id VARCHAR(64) REFERENCES substations(id) ON DELETE SET NULL,
    substation_name VARCHAR(255) NOT NULL,
    section_office VARCHAR(128) NOT NULL,
    primary_asset_type VARCHAR(64) NOT NULL DEFAULT 'FEEDER' CHECK (primary_asset_type IN ('FEEDER', 'TRANSFORMER', 'SERVICE_DROP', 'SUBSTATION', 'CABLE', 'UNASSIGNED')),
    primary_asset_code VARCHAR(64) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'P2_HIGH' CHECK (priority IN ('P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_LOW')),
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED')),
    summary TEXT NOT NULL,
    locality VARCHAR(255) NOT NULL,
    consumers_affected INT NOT NULL DEFAULT 0,
    
    -- Accountable Personnel Assigned
    allocated_technician_id VARCHAR(64) REFERENCES linemen_technicians(id) ON DELETE SET NULL,
    assigned_technician_name VARCHAR(255),
    assigned_technician_role VARCHAR(128),
    assigned_technician_phone VARCHAR(32),

    allocated_crew_id VARCHAR(64) REFERENCES section_gangs(id) ON DELETE SET NULL,
    assigned_crew_name VARCHAR(255),
    assigned_crew_lead VARCHAR(255),
    assigned_crew_vehicle VARCHAR(64),
    assigned_crew_phone VARCHAR(32),

    assigned_operator_name VARCHAR(255) DEFAULT 'Operator Ramesh Varma (ID: OP-842)',

    -- Notifications & Comms
    acknowledgement_channel VARCHAR(64) DEFAULT 'SMS / EMAIL',
    acknowledgement_status VARCHAR(32) DEFAULT 'SENT' CHECK (acknowledgement_status IN ('SENT', 'PENDING', 'FAILED', 'DISABLED')),
    recipient_contact VARCHAR(64),

    -- Lifecycle & Resolution
    resolution_category VARCHAR(255),
    resolution_reason TEXT,
    duration_text VARCHAR(64),
    mttr_minutes INT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Chronological Activity Log & Comments Thread
CREATE TABLE ticket_comments (
    id VARCHAR(64) PRIMARY KEY,
    ticket_id VARCHAR(64) NOT NULL REFERENCES incident_tickets(id) ON DELETE CASCADE,
    author VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL CHECK (role IN ('OPERATOR', 'FIELD_CREW', 'AI_SYSTEM', 'SUPERVISOR', 'SYSTEM')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- DOMAIN 4: TELEPHONY GATE & CALL TRANSCRIPTS (MOCKED FOR DEMO)
-- ==============================================================================

-- 4.1 Telephony Sessions
CREATE TABLE telephony_calls (
    id VARCHAR(64) PRIMARY KEY,
    provider VARCHAR(64) NOT NULL DEFAULT 'exotel_mock',
    provider_call_id VARCHAR(128) UNIQUE,
    caller_phone VARCHAR(32) NOT NULL,
    dialed_number VARCHAR(32) NOT NULL DEFAULT '1912',
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
    matched_hub_id VARCHAR(64) REFERENCES feeders(id) ON DELETE SET NULL,
    matched_usc_number VARCHAR(64),
    ticket_id VARCHAR(64) REFERENCES incident_tickets(id) ON DELETE SET NULL,
    locality VARCHAR(255),
    duration_seconds INT DEFAULT 45,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 Conversational Transcript Segments
CREATE TABLE call_transcript_segments (
    id VARCHAR(64) PRIMARY KEY,
    call_id VARCHAR(64) NOT NULL REFERENCES telephony_calls(id) ON DELETE CASCADE,
    sequence_no INT NOT NULL,
    speaker VARCHAR(32) NOT NULL CHECK (speaker IN ('AI_AGENT', 'CALLER', 'SYSTEM')),
    text TEXT NOT NULL,
    timestamp_offset VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- DOMAIN 5: AI OUTAGE DIAGNOSIS & CAUSAL EVIDENCE (MOCKED FOR DEMO)
-- ==============================================================================

CREATE TABLE ai_diagnoses (
    id VARCHAR(64) PRIMARY KEY,
    ticket_id VARCHAR(64) NOT NULL REFERENCES incident_tickets(id) ON DELETE CASCADE,
    scenario_key VARCHAR(64) NOT NULL,
    primary_hypothesis_title VARCHAR(255) NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 95.0,
    description TEXT NOT NULL,
    evidence_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_verification JSONB NOT NULL DEFAULT '[]'::jsonb,
    guardrails_applied JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- DOMAIN 6: SYSTEM AUDIT EVENTS
-- ==============================================================================

CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(64) NOT NULL,
    details TEXT NOT NULL,
    entity_type VARCHAR(64),
    entity_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR LOW-LATENCY REALTIME OPERATIONS
-- ==============================================================================

CREATE INDEX idx_feeders_substation ON feeders(substation_id);
CREATE INDEX idx_feeders_status ON feeders(simulated_state);
CREATE INDEX idx_dtrs_feeder ON distribution_transformers(feeder_id);
CREATE INDEX idx_dtrs_status ON distribution_transformers(simulated_state);
CREATE INDEX idx_usc_dtr ON service_connections(dtr_id);
CREATE INDEX idx_usc_phone ON service_connections(contact_phone);

CREATE INDEX idx_tickets_status ON incident_tickets(status);
CREATE INDEX idx_tickets_priority ON incident_tickets(priority);
CREATE INDEX idx_tickets_section ON incident_tickets(section_office);
CREATE INDEX idx_tickets_asset ON incident_tickets(primary_asset_code);
CREATE INDEX idx_tickets_tech ON incident_tickets(allocated_technician_id);
CREATE INDEX idx_tickets_crew ON incident_tickets(allocated_crew_id);

CREATE INDEX idx_technicians_gang ON linemen_technicians(gang_id);
CREATE INDEX idx_technicians_status ON linemen_technicians(status);

CREATE INDEX idx_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

