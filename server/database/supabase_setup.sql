-- ==============================================================================
-- GridResQ AI — Complete Supabase / PostgreSQL Setup Script
-- Tables, Constraints, Indexes, TSSPDCL Seed Data & Realtime Publication
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if re-running
DROP TABLE IF EXISTS users CASCADE;
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

CREATE TABLE ticket_comments (
    id VARCHAR(64) PRIMARY KEY,
    ticket_id VARCHAR(64) NOT NULL REFERENCES incident_tickets(id) ON DELETE CASCADE,
    author VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL CHECK (role IN ('OPERATOR', 'FIELD_CREW', 'AI_SYSTEM', 'SUPERVISOR', 'SYSTEM')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- DOMAIN 4: TELEPHONY & CALLS (MOCKED FOR NOW)
-- ==============================================================================

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

CREATE TABLE call_transcript_segments (
    id VARCHAR(64) PRIMARY KEY,
    call_id VARCHAR(64) NOT NULL REFERENCES telephony_calls(id) ON DELETE CASCADE,
    sequence_no INT NOT NULL,
    speaker VARCHAR(32) NOT NULL CHECK (speaker IN ('AI_AGENT', 'CALLER', 'SYSTEM')),
    text TEXT NOT NULL,
    timestamp_offset VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(64) NOT NULL,
    details TEXT NOT NULL,
    entity_type VARCHAR(64),
    entity_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DOMAIN 5: USERS & OPERATIONAL ROLES
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    employee_id VARCHAR(64),
    role VARCHAR(64) NOT NULL DEFAULT 'NOC_OPERATOR' CHECK (role IN ('NOC_OPERATOR', 'SECTION_ENGINEER', 'FIELD_LINEMAN', 'ADMIN')),
    section_office VARCHAR(128) NOT NULL DEFAULT 'Cybercity Division, TSSPDCL',
    is_active INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);


-- ==============================================================================
-- INDEXES FOR FAST OPERATOR QUERYING
-- ==============================================================================

CREATE INDEX idx_feeders_substation ON feeders(substation_id);
CREATE INDEX idx_dtrs_feeder ON distribution_transformers(feeder_id);
CREATE INDEX idx_tickets_status ON incident_tickets(status);
CREATE INDEX idx_tickets_priority ON incident_tickets(priority);
CREATE INDEX idx_tickets_section ON incident_tickets(section_office);
CREATE INDEX idx_tickets_tech ON incident_tickets(allocated_technician_id);
CREATE INDEX idx_tickets_crew ON incident_tickets(allocated_crew_id);
CREATE INDEX idx_technicians_status ON linemen_technicians(status);
CREATE INDEX idx_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ==============================================================================
-- TSSPDCL HYDERABAD SEED DATA (CYBERCITY CIRCLE)
-- ==============================================================================

-- Substations
INSERT INTO substations (id, name, voltage_kv, circle, division, section_office, latitude, longitude, status, peak_load_mva, incoming_lines_count) VALUES
('sub-mdp', 'Madhapur 33/11kV Substation', '33/11kV', 'Cybercity Circle', 'Gachibowli Division', 'Madhapur Section', 17.4490, 78.3790, 'HEALTHY', 34.2, 2),
('sub-knd', 'Kondapur 33/11kV Substation', '33/11kV', 'Cybercity Circle', 'Kondapur Division', 'Kondapur Section', 17.4640, 78.3650, 'HEALTHY', 26.5, 2),
('sub-gcb', 'Gachibowli 33/11kV Substation', '33/11kV', 'Cybercity Circle', 'Gachibowli Division', 'Gachibowli Section', 17.4350, 78.3550, 'HEALTHY', 38.0, 3);

-- Feeders (Hubs)
INSERT INTO feeders (id, substation_id, feeder_code, name, locality, voltage_kv, breaker_status, simulated_state, load_amps, connected_dtrs_count, connected_meters_count, latitude, longitude) VALUES
('hub-07', 'sub-mdp', 'F-07-CYBER', 'Cyber Towers & Ayyappa Society Feeder F-07', 'Madhapur Section, TSSPDCL', 11.0, 'TRIPPED', 'DOWN', 0.0, 3, 740, 17.4465, 78.3820),
('hub-03', 'sub-knd', 'F-03-KNDPR', 'Kondapur & Botanical Garden Feeder F-03', 'Kondapur Section, TSSPDCL', 11.0, 'CLOSED', 'HEALTHY', 142.5, 2, 430, 17.4620, 78.3650),
('hub-12', 'sub-gcb', 'F-12-GACHIBOWLI', 'Financial District & Waverock Feeder F-12', 'Gachibowli Section, TSSPDCL', 11.0, 'CLOSED', 'DEGRADED', 198.0, 2, 520, 17.4380, 78.3610);

-- Distribution Transformers
INSERT INTO distribution_transformers (id, feeder_id, dtr_code, name, capacity_kva, primary_voltage_v, secondary_voltage_v, simulated_state, telemetry_status, voltage_r, voltage_y, voltage_b, neutral_voltage, consumers_affected, latitude, longitude) VALUES
('dtr-mdp-101', 'hub-07', 'DTR-MDP-101', '100kVA DTR Kavuri Hills Phase 1', 100, 11000, '415V/240V', 'DOWN', 'Zero Secondary Voltage', 0.0, 0.0, 0.0, 0.0, 180, 17.4425, 78.3860),
('dtr-mdp-102', 'hub-07', 'DTR-MDP-102', '250kVA DTR Ayyappa Society Main Road', 250, 11000, '415V/240V', 'DOWN', 'LT Breaker Open / Tripped', 0.0, 0.0, 0.0, 0.0, 320, 17.4465, 78.3820),
('dtr-mdp-103', 'hub-07', 'DTR-MDP-103', '160kVA DTR Madhapur 100ft Road', 160, 11000, '415V/240V', 'DOWN', 'Zero Secondary Voltage', 0.0, 0.0, 0.0, 0.0, 240, 17.4485, 78.3910),
('dtr-knd-201', 'hub-03', 'DTR-KND-201', '250kVA DTR Kondapur RTO Circle', 250, 11000, '415V/240V', 'HEALTHY', 'Nominal (241V Phase-Neutral)', 241.0, 240.5, 239.8, 1.4, 0, 17.4640, 78.3650),
('dtr-knd-202', 'hub-03', 'DTR-KND-202', '100kVA DTR Botanical Garden Road', 100, 11000, '415V/240V', 'HEALTHY', 'Nominal (239V Phase-Neutral)', 239.2, 238.9, 240.1, 1.2, 0, 17.4580, 78.3620),
('dtr-gcb-301', 'hub-12', 'DTR-GCB-301', '500kVA DTR Waverock Junction Substation', 500, 11000, '415V/240V', 'PHASE_DROP', 'B-Phase Voltage Dip (175V)', 240.0, 238.5, 175.2, 18.6, 140, 17.4360, 78.3580),
('dtr-gcb-302', 'hub-12', 'DTR-GCB-302', '315kVA DTR Wipro Circle Technology Park', 315, 11000, '415V/240V', 'HEALTHY', 'Nominal (242V Phase-Neutral)', 242.0, 241.5, 240.8, 1.3, 0, 17.4390, 78.3640);

-- Consumer Service Points
INSERT INTO service_connections (id, usc_number, dtr_id, consumer_name, contact_phone, premise_address, locality, tariff_category, contracted_load_kw, smart_meter_id, meter_status, latitude, longitude) VALUES
('usc-01', '1104-58293', 'dtr-mdp-102', 'Venkatesh Rao', '+91 98490 23456', 'Plot 42, Ayyappa Society Main Road, Madhapur', 'Ayyappa Society, Madhapur', 'LT-I(A) Domestic', 5.0, 'SM-HYD-10201', 'POWER_FAIL', 17.4468, 78.3824),
('usc-02', '1104-58294', 'dtr-mdp-102', 'Srinivas Goud', '+91 98490 55441', 'Plot 88, 2nd Cross, Ayyappa Society, Madhapur', 'Ayyappa Society, Madhapur', 'LT-II(B) Commercial', 12.0, 'SM-HYD-10202', 'POWER_FAIL', 17.4463, 78.3818),
('usc-03', '1109-33821', 'dtr-gcb-301', 'Anand Varma (Waverock Facilities)', '+91 98490 66782', 'Waverock IT Park Building 2, Financial District', 'Financial District, Gachibowli', 'HT-II Industrial', 75.0, 'SM-HYD-30101', 'ENERGIZED', 17.4362, 78.3585),
('usc-04', '1107-12948', 'dtr-knd-201', 'Vasavi Residency Association', '+91 98490 88223', 'Vasavi Residency, Near RTO Office, Kondapur', 'Kondapur RTO Circle', 'LT-I(B) Multi-Dwelling', 45.0, 'SM-HYD-20101', 'ENERGIZED', 17.4642, 78.3653),
('usc-05', '1104-44190', 'dtr-mdp-101', 'Silicon Valley Co-Op Housing', '+91 98490 11982', 'Flat 302, Silicon Valley Colony, Madhapur', 'Silicon Valley, Madhapur', 'LT-I(A) Domestic', 4.0, 'SM-HYD-10101', 'ENERGIZED', 17.4428, 78.3865),
('usc-06', '1109-99014', 'dtr-gcb-301', 'Cyberabad Tech Park Infra', '+91 98490 99882', 'Tower A, Nanakramguda Financial District', 'Financial District, Gachibowli', 'HT-I Commercial', 150.0, 'SM-HYD-30102', 'POWER_FAIL', 17.4355, 78.3572);

-- Section Gangs
INSERT INTO section_gangs (id, name, short_name, section_office, specialization, specialization_label, vehicle_number, vehicle_type, base_depot, current_location_text, latitude, longitude, status, speed_kmph, eta_minutes, lead_name, lead_phone, contact_phone, assigned_incident_id, assigned_ticket_number, assigned_task_description, assigned_at) VALUES
('crew-01', 'TSSPDCL Emergency Gang (Madhapur)', 'Madhapur Emergency Gang', 'AE / Operation / Madhapur (Cybercity Circle)', 'HIGH_VOLTAGE_11KV', '11kV Overhead Lines & Tree Trimming', 'TS-09-EA-4412', 'Hydraulic Sky-lift Truck (18m Reach)', 'Madhapur 33/11kV Substation Yard', 'Ayyappa Society, Madhapur (En Route)', 17.4490, 78.3790, 'DISPATCHED', 32, 6, 'K. Srinivas Reddy (AE / Op)', '+91 94906 18201', '+91 94906 18201', 'tkt-001', 'TSSPDCL-HYD-00412', 'Outage on 11kV Feeder F-07 affecting Ayyappa Society & Kavuri Hills', NOW() - INTERVAL '15 minutes'),
('crew-02', 'TSSPDCL DTR Breakdown Squad (Kondapur Section)', 'Kondapur DTR Crane Squad', 'Sub-Engineer / Operation / Kondapur', 'TRANSFORMER_DTR_BREAKDOWN', 'DTR Replacement & Bushing Testing', 'TS-09-UA-8831', 'Heavy Mobile Crane Truck (10-Ton Bed)', 'Kondapur RTO Section Depot', 'Kondapur RTO Circle Section Depot', 17.4640, 78.3650, 'AVAILABLE', 0, 12, 'M. Venkat Rao (Sub-Engineer)', '+91 94906 18202', '+91 94906 18202', NULL, NULL, NULL, NULL),
('crew-03', 'TSSPDCL Fuse-Off Call Gang (Gachibowli Section)', 'Gachibowli Fuse-Off Squad', 'Lineman / Operation / Gachibowli', 'FUSE_OFF_CALL', 'LT Fuse-Off Calls & Cable Punctures', 'TS-09-GA-1102', 'Rapid Response 4x4 Bolero Utility Van', 'Gachibowli Stadium Substation Depot', 'Financial District Wipro Circle (En Route to Waverock)', 17.4350, 78.3550, 'DISPATCHED', 36, 5, 'Y. Yadagiri (Lead Lineman)', '+91 94906 18203', '+91 94906 18203', 'tkt-002', 'TSSPDCL-HYD-00418', 'Investigating phase drop & neutral voltage shift on DTR-GCB-301 secondary bus', NOW() - INTERVAL '45 minutes');

-- Linemen & Engineers (11 Technicians)
INSERT INTO linemen_technicians (id, gang_id, name, role, phone, avatar_initials, experience_text, status, assigned_ticket_id, assigned_ticket_number, assigned_task_description, assigned_at) VALUES
('tech-mdp-1', 'crew-01', 'K. Srinivas Reddy', 'AE / Operation (Lead)', '+91 94906 18201', 'SR', '15 yrs • 33/11kV Switching In-charge', 'AVAILABLE', NULL, NULL, NULL, NULL),
('tech-mdp-2', 'crew-01', 'K. Ramulu', 'Senior Lineman', '+91 94408 12301', 'KR', '12 yrs • Live-line Glove & Hotstick Certified', 'ASSIGNED', 'tkt-001', 'TSSPDCL-HYD-00412', 'Outage on 11kV Feeder F-07 affecting Ayyappa Society & Kavuri Hills', NOW() - INTERVAL '15 minutes'),
('tech-mdp-3', 'crew-01', 'B. Venkat', 'Assistant Lineman (ALM)', '+91 94408 12302', 'BV', '6 yrs • Overhead Line Climbing & Earthing', 'AVAILABLE', NULL, NULL, NULL, NULL),
('tech-mdp-4', 'crew-01', 'G. Ravi', 'Sky-lift Hydraulic Operator', '+91 94408 12303', 'GR', '8 yrs • Aerial Platform & Traffic Safety', 'AVAILABLE', NULL, NULL, NULL, NULL),

('tech-knd-1', 'crew-02', 'M. Venkat Rao', 'Sub-Engineer (Lead)', '+91 94906 18202', 'VR', '14 yrs • DTR Megger & Oil BDV Testing', 'AVAILABLE', NULL, NULL, NULL, NULL),
('tech-knd-2', 'crew-02', 'P. Naresh', 'Senior Lineman', '+91 94408 22301', 'PN', '10 yrs • HT/LT Bushing & HG Fuse Specialist', 'AVAILABLE', NULL, NULL, NULL, NULL),
('tech-knd-3', 'crew-02', 'S. Ramesh', 'Junior Lineman', '+91 94408 22302', 'SR', '4 yrs • Neutral Earthing Pit & Clamping', 'AVAILABLE', NULL, NULL, NULL, NULL),
('tech-knd-4', 'crew-02', 'T. Krishna', 'Crane & Rigging Operator', '+91 94408 22303', 'TK', '9 yrs • Heavy Rigging (Standby at depot)', 'RESTING', NULL, NULL, NULL, NULL),

('tech-gcb-1', 'crew-03', 'Y. Yadagiri', 'Lead Lineman (FOC In-charge)', '+91 94906 18203', 'YY', '11 yrs • 415V Phase Balancing & LT Fuses', 'ASSIGNED', 'tkt-002', 'TSSPDCL-HYD-00418', 'Investigating phase drop & neutral voltage shift on DTR-GCB-301 secondary bus', NOW() - INTERVAL '45 minutes'),
('tech-gcb-2', 'crew-03', 'Ch. Suresh', 'Lineman Assistant', '+91 94408 33301', 'CS', '5 yrs • Consumer Meter & Service Drop Specialist', 'AVAILABLE', NULL, NULL, NULL, NULL),
('tech-gcb-3', 'crew-03', 'A. Kumar', 'Patrol Driver & Field Tech', '+91 94408 33302', 'AK', '7 yrs • Emergency Response Navigation', 'AVAILABLE', NULL, NULL, NULL, NULL);

-- Incident Tickets
INSERT INTO incident_tickets (
    id, ticket_number, service_connection_no, service_connection_id, substation_id, substation_name, section_office,
    primary_asset_type, primary_asset_code, priority, status, summary, locality, consumers_affected,
    allocated_technician_id, assigned_technician_name, assigned_technician_role, assigned_technician_phone,
    allocated_crew_id, assigned_crew_name, assigned_crew_lead, assigned_crew_vehicle, assigned_crew_phone,
    assigned_operator_name, acknowledgement_channel, acknowledgement_status, recipient_contact,
    resolution_category, resolution_reason, duration_text, mttr_minutes, resolved_at, created_at
) VALUES
('tkt-001', 'TSSPDCL-HYD-00412', '1104-58293', 'usc-01', 'sub-mdp', 'Madhapur 33/11kV Substation', 'Madhapur Section',
 'FEEDER', 'F-07-CYBER', 'P1_CRITICAL', 'OPEN', 'Outage on 11kV Feeder F-07 affecting Ayyappa Society & Kavuri Hills', 'Ayyappa Society, Madhapur', 740,
 'tech-mdp-2', 'K. Ramulu', 'Senior Lineman', '+91 94408 12301',
 'crew-01', 'TSSPDCL Emergency Gang (Madhapur)', 'K. Srinivas Reddy (AE / Op)', 'Hydraulic Sky-lift TS-09-EA-4412', '+91 94906 18201',
 'Operator Ramesh Varma (ID: OP-842)', 'SMS / EMAIL', 'SENT', '+91 98490 23456',
 NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '25 minutes'),

('tkt-002', 'TSSPDCL-HYD-00418', '1109-33821', 'usc-03', 'sub-gcb', 'Gachibowli 33/11kV Substation', 'Gachibowli Section',
 'TRANSFORMER', 'DTR-GCB-301', 'P2_HIGH', 'IN_PROGRESS', 'Phase drop & severe under-voltage on DTR-GCB-301 near Waverock IT Park', 'Financial District, Gachibowli', 140,
 'tech-gcb-1', 'Y. Yadagiri', 'Lead Lineman (FOC In-charge)', '+91 94906 18203',
 'crew-03', 'TSSPDCL Fuse-Off Call Gang (Gachibowli)', 'Y. Yadagiri (Lead Lineman)', 'Emergency Bolero TS-09-GA-1102', '+91 94906 18203',
 'Operator Suresh Kumar (ID: OP-811)', 'SMS', 'SENT', '+91 98490 66782',
 NULL, NULL, 'Active: 45m', 45, NULL, NOW() - INTERVAL '50 minutes'),

('tkt-003', 'TSSPDCL-HYD-00408', '1104-58294', 'usc-02', 'sub-mdp', 'Madhapur 33/11kV Substation', 'Madhapur Section',
 'TRANSFORMER', 'DTR-MDP-102', 'P1_CRITICAL', 'RESOLVED', '250kVA DTR-MDP-102 Lightning flashover & blown 11kV Horn Gap fuse', 'Ayyappa Society Main Road, Madhapur', 320,
 'tech-knd-2', 'P. Naresh', 'Senior Lineman', '+91 94408 22301',
 'crew-02', 'TSSPDCL DTR Breakdown Gang (Kondapur)', 'M. Venkat Rao (Sub-Eng)', 'Heavy Crane Van TS-09-UA-8831', '+91 94906 18202',
 'Operator Anita Devi (ID: OP-790)', 'SMS / PORTAL', 'SENT', '+91 98490 55441',
 'Transformer 11kV HG Fuse Replaced', 'Replaced blown 11kV Horn Gap (HG) fuse unit on DTR-MDP-102. Cleared tree branch carbon residue and restored load. Secondary voltage normalized at 415V/230V.', '1h 25m', 85, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '4 hours 25 minutes'),

('tkt-004', 'TSSPDCL-HYD-00395', '1107-12948', 'usc-04', 'sub-knd', 'Kondapur 33/11kV Substation', 'Kondapur Section',
 'FEEDER', 'F-03-KNDPR', 'P2_HIGH', 'RESOLVED', '11kV Kondapur Main Feeder sparks and loose PG clamp jumper near RTA Office', 'Kondapur RTO Circle, Hyderabad', 510,
 'tech-knd-3', 'S. Ramesh', 'Junior Lineman', '+91 94408 22302',
 'crew-02', 'TSSPDCL DTR Breakdown Gang (Kondapur)', 'M. Venkat Rao (Sub-Eng)', 'Heavy Crane Van TS-09-UA-8831', '+91 94906 18202',
 'Operator Ramesh Varma (ID: OP-842)', 'SMS', 'SENT', '+91 98490 88223',
 '11kV Line Jumper Re-crimped & Insulator Cleaned', 'Tightened loose Parallel Groove (PG) clamp jumper on pole #KP-14 near Kondapur RTA Office. Cleaned carbonized pin insulator surface. 11kV line recharged successfully.', '1h 15m', 75, NOW() - INTERVAL '22 hours', NOW() - INTERVAL '23 hours 15 minutes'),

('tkt-005', 'TSSPDCL-HYD-00401', '1104-44190', 'usc-05', 'sub-mdp', 'Madhapur 33/11kV Substation', 'Madhapur Section',
 'TRANSFORMER', 'DTR-MDP-101', 'P3_MEDIUM', 'RESOLVED', '3-Phase low voltage & neutral shift on 100kVA DTR-MDP-101', 'Silicon Valley, Madhapur', 85,
 NULL, NULL, NULL, NULL,
 'crew-01', 'TSSPDCL Emergency Gang (Madhapur)', 'K. Srinivas Reddy (AE / Op)', 'Hydraulic Sky-lift TS-09-EA-4412', '+91 94906 18201',
 'Operator Suresh Kumar (ID: OP-811)', 'SMS', 'SENT', '+91 98490 11982',
 'Neutral Earthing Pit Reconditioned', 'Re-watered transformer earthing pit with saline-charcoal solution and tightened copper neutral bus terminal. Neutral voltage to ground restored to <2V.', '1h 15m', 75, NOW() - INTERVAL '28 hours', NOW() - INTERVAL '29 hours 15 minutes'),

('tkt-006', 'TSSPDCL-HYD-00422', '1109-99014', 'usc-06', 'sub-gcb', 'Gachibowli 33/11kV Substation', 'Gachibowli Section',
 'CABLE', 'F-12-FIN', 'P1_CRITICAL', 'ESCALATED', 'Underground 11kV XLPE cable fault between Substation and Waverock Junction', 'Financial District, Gachibowli', 380,
 NULL, NULL, NULL, NULL,
 'crew-03', 'Cybercity Circle Specialized Cable Gang', 'DE / Technical Cybercity', 'Cable Fault Locator Van TS-09-EX-0099', '+91 94906 18200',
 'Operator Ramesh Varma (ID: OP-842)', 'SMS / PORTAL', 'SENT', '+91 98490 99882',
 NULL, NULL, 'Active: 1h 10m', 70, NULL, NOW() - INTERVAL '70 minutes');

-- Ticket Comments
INSERT INTO ticket_comments (id, ticket_id, author, role, content, created_at) VALUES
('c-101', 'tkt-001', 'AI Triage Agent', 'AI_SYSTEM', 'Telemetry verification confirmed: VCB-07 relay trip 51N (Earth Fault) at Madhapur 33kV Substation. 740 consumer meters lost heartbeat.', NOW() - INTERVAL '24 minutes'),
('c-102', 'tkt-001', 'Operator Ramesh Varma', 'OPERATOR', 'Broadcast outage SMS notification sent to 740 consumers in Ayyappa Society & Kavuri Hills. Alerted Madhapur Section AE.', NOW() - INTERVAL '21 minutes'),
('c-103', 'tkt-001', 'K. Srinivas Reddy (AE / Op)', 'FIELD_CREW', 'Madhapur Emergency Gang dispatched with Sky-lift TS-09-EA-4412. En route along 100ft road to isolate Gang Operated (GO) switch.', NOW() - INTERVAL '15 minutes'),

('c-201', 'tkt-002', 'AI Triage Agent', 'AI_SYSTEM', 'Smart meter alert: Neutral-to-Earth voltage spike (>18V) and B-phase voltage drop to 175V detected on DTR-GCB-301 secondary bus.', NOW() - INTERVAL '49 minutes'),
('c-202', 'tkt-002', 'Operator Suresh Kumar', 'OPERATOR', 'Assigned Gachibowli Fuse-Off Gang to inspect distribution box and check for loose LT neutral terminal.', NOW() - INTERVAL '45 minutes'),
('c-203', 'tkt-002', 'Y. Yadagiri (Lead Lineman)', 'FIELD_CREW', 'Crew on site at Waverock sub-station enclosure. LT fuse box opened; discovered overheated B-phase HRC fuse base.', NOW() - INTERVAL '25 minutes'),

('c-601', 'tkt-006', 'AI Triage Agent', 'AI_SYSTEM', 'Feeder F-12 tripped on instantaneous overcurrent. High-voltage insulation test showed zero resistance between R-phase and metallic sheath.', NOW() - INTERVAL '69 minutes'),
('c-602', 'tkt-006', 'Operator Ramesh Varma', 'OPERATOR', 'Underground cable puncture verified. Escalated to Cybercity Divisional Engineer. Requested Specialized Cable Thumper Van.', NOW() - INTERVAL '55 minutes'),
('c-603', 'tkt-006', 'DE / Technical Cybercity', 'SUPERVISOR', 'Fault localized to 420 meters from Gachibowli 33kV Substation. GHMC Cyberabad emergency road cutting permission requested.', NOW() - INTERVAL '30 minutes');

-- Audit Logs
INSERT INTO audit_logs (id, action, details, entity_type, entity_id) VALUES
('aud-01', 'SYSTEM_BOOT', 'TSSPDCL Hyderabad Metro GridResQ Operations Engine Active on Cybercity Circle.', 'SYSTEM', 'SYS-01'),
('aud-02', 'OUTAGE_DETECTED', 'Feeder F-07 tripped at Madhapur Substation. Ticket TSSPDCL-HYD-00412 generated.', 'TICKET', 'tkt-001'),
('aud-03', 'TECH_ASSIGNED', 'Assigned Senior Lineman K. Ramulu (+91 94408 12301) to incident TSSPDCL-HYD-00412.', 'TECHNICIAN', 'tech-mdp-2'),
('aud-04', 'GANG_DISPATCHED', 'Dispatched Madhapur Emergency Gang (TS-09-EA-4412). ETA: 6 mins.', 'GANG', 'crew-01');

-- Default Operations Officers & Linemen Accounts (Default Password: Password123!)
INSERT INTO users (id, email, password_hash, full_name, phone, employee_id, role, section_office) VALUES
('usr-op-842', 'ramesh.varma@tsspdcl.gov.in', '$2b$12$bvTEStxbh10dkgtnNjDlE.8zbA2uyMsDF3VrzfYSb4ECsoy2zk2KO', 'Operator Ramesh Varma', '+91 94906 18001', 'OP-842', 'NOC_OPERATOR', 'Cybercity Division Operations NOC'),
('usr-ae-104', 'srinivas.reddy@tsspdcl.gov.in', '$2b$12$bvTEStxbh10dkgtnNjDlE.8zbA2uyMsDF3VrzfYSb4ECsoy2zk2KO', 'K. Srinivas Reddy (AE / Op)', '+91 94906 18201', 'AE-104', 'SECTION_ENGINEER', 'Madhapur Section, TSSPDCL'),
('usr-lm-302', 'ramulu.k@tsspdcl.gov.in', '$2b$12$bvTEStxbh10dkgtnNjDlE.8zbA2uyMsDF3VrzfYSb4ECsoy2zk2KO', 'K. Ramulu (Senior Lineman)', '+91 94408 12301', 'LM-302', 'FIELD_LINEMAN', 'Madhapur Emergency Squad')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION (For live dashboard SSE / WebSocket updates)
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
    ALTER PUBLICATION supabase_realtime ADD TABLE incident_tickets;
    ALTER PUBLICATION supabase_realtime ADD TABLE ticket_comments;
    ALTER PUBLICATION supabase_realtime ADD TABLE linemen_technicians;
    ALTER PUBLICATION supabase_realtime ADD TABLE section_gangs;
    ALTER PUBLICATION supabase_realtime ADD TABLE feeders;
    ALTER PUBLICATION supabase_realtime ADD TABLE distribution_transformers;
    ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
  END IF;
END $$;


