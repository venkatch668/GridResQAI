import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from server.database.session import Base

class Substation(Base):
    __tablename__ = "substations"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    voltage_kv = Column(String(32), default="33/11kV")
    circle = Column(String(128), default="Cybercity Circle")
    division = Column(String(128), default="Gachibowli Division")
    section_office = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String(32), default="HEALTHY")
    peak_load_mva = Column(Float, default=28.5)
    incoming_lines_count = Column(Integer, default=2)
    metadata_json = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    feeders = relationship("Feeder", back_populates="substation", cascade="all, delete-orphan")


class Feeder(Base):
    __tablename__ = "feeders"

    id = Column(String(64), primary_key=True)
    substation_id = Column(String(64), ForeignKey("substations.id"), nullable=False)
    feeder_code = Column(String(64), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    locality = Column(String(255), nullable=False)
    voltage_kv = Column(Float, default=11.0)
    breaker_status = Column(String(32), default="CLOSED")
    simulated_state = Column(String(32), default="HEALTHY")
    load_amps = Column(Float, default=145.0)
    connected_dtrs_count = Column(Integer, default=0)
    connected_meters_count = Column(Integer, default=0)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    route_coordinates = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    substation = relationship("Substation", back_populates="feeders")
    transformers = relationship("DistributionTransformer", back_populates="feeder", cascade="all, delete-orphan")


class DistributionTransformer(Base):
    __tablename__ = "distribution_transformers"

    id = Column(String(64), primary_key=True)
    feeder_id = Column(String(64), ForeignKey("feeders.id"), nullable=False)
    dtr_code = Column(String(64), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    capacity_kva = Column(Integer, nullable=False)
    primary_voltage_v = Column(Integer, default=11000)
    secondary_voltage_v = Column(String(32), default="415V/240V")
    simulated_state = Column(String(32), default="HEALTHY")
    telemetry_status = Column(String(255), default="Nominal (240V Phase-Neutral)")
    voltage_r = Column(Float, default=240.0)
    voltage_y = Column(Float, default=241.0)
    voltage_b = Column(Float, default=239.0)
    neutral_voltage = Column(Float, default=1.5)
    consumers_affected = Column(Integer, default=0)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    metadata_json = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    feeder = relationship("Feeder", back_populates="transformers")
    service_connections = relationship("ServiceConnection", back_populates="dtr", cascade="all, delete-orphan")


class ServiceConnection(Base):
    __tablename__ = "service_connections"

    id = Column(String(64), primary_key=True)
    usc_number = Column(String(64), unique=True, nullable=False)
    dtr_id = Column(String(64), ForeignKey("distribution_transformers.id"), nullable=False)
    consumer_name = Column(String(255), nullable=False)
    contact_phone = Column(String(32), nullable=False)
    premise_address = Column(Text, nullable=False)
    locality = Column(String(255), nullable=False)
    tariff_category = Column(String(64), default="LT-I(A) Domestic")
    contracted_load_kw = Column(Float, default=5.0)
    smart_meter_id = Column(String(64), unique=True)
    meter_status = Column(String(32), default="ENERGIZED")
    last_heartbeat_at = Column(DateTime, default=datetime.datetime.utcnow)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    dtr = relationship("DistributionTransformer", back_populates="service_connections")


class SectionGang(Base):
    __tablename__ = "section_gangs"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    short_name = Column(String(128), nullable=False)
    section_office = Column(String(128), nullable=False)
    specialization = Column(String(64), nullable=False)
    specialization_label = Column(String(255), nullable=False)
    vehicle_number = Column(String(64), nullable=False)
    vehicle_type = Column(String(255), nullable=False)
    base_depot = Column(String(255), nullable=False)
    current_location_text = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String(32), default="AVAILABLE")
    speed_kmph = Column(Integer, default=0)
    eta_minutes = Column(Integer, default=8)
    lead_name = Column(String(255), nullable=False)
    lead_phone = Column(String(32), nullable=False)
    contact_phone = Column(String(32), nullable=False)
    assigned_incident_id = Column(String(64))
    assigned_ticket_number = Column(String(64))
    assigned_task_description = Column(Text)
    assigned_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    members = relationship("LinemanTechnician", back_populates="gang", cascade="all, delete-orphan")


class LinemanTechnician(Base):
    __tablename__ = "linemen_technicians"

    id = Column(String(64), primary_key=True)
    gang_id = Column(String(64), ForeignKey("section_gangs.id"), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(128), nullable=False)
    phone = Column(String(32), nullable=False)
    avatar_initials = Column(String(8), nullable=False)
    experience_text = Column(String(255), nullable=False)
    status = Column(String(32), default="AVAILABLE")
    assigned_ticket_id = Column(String(64))
    assigned_ticket_number = Column(String(64))
    assigned_task_description = Column(Text)
    assigned_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    gang = relationship("SectionGang", back_populates="members")


class IncidentTicket(Base):
    __tablename__ = "incident_tickets"

    id = Column(String(64), primary_key=True)
    ticket_number = Column(String(64), unique=True, nullable=False)
    service_connection_no = Column(String(64))
    service_connection_id = Column(String(64), ForeignKey("service_connections.id"))
    substation_id = Column(String(64), ForeignKey("substations.id"))
    substation_name = Column(String(255), nullable=False)
    section_office = Column(String(128), nullable=False)
    primary_asset_type = Column(String(64), default="FEEDER")
    primary_asset_code = Column(String(64), nullable=False)
    priority = Column(String(32), default="P2_HIGH")
    status = Column(String(32), default="OPEN")
    summary = Column(Text, nullable=False)
    locality = Column(String(255), nullable=False)
    consumers_affected = Column(Integer, default=0)

    # Individual Technician Assigned
    allocated_technician_id = Column(String(64), ForeignKey("linemen_technicians.id"))
    assigned_technician_name = Column(String(255))
    assigned_technician_role = Column(String(128))
    assigned_technician_phone = Column(String(32))

    # Section Gang Assigned
    allocated_crew_id = Column(String(64), ForeignKey("section_gangs.id"))
    assigned_crew_name = Column(String(255))
    assigned_crew_lead = Column(String(255))
    assigned_crew_vehicle = Column(String(64))
    assigned_crew_phone = Column(String(32))

    assigned_operator_name = Column(String(255), default="Operator Ramesh Varma (ID: OP-842)")

    acknowledgement_channel = Column(String(64), default="SMS / EMAIL")
    acknowledgement_status = Column(String(32), default="SENT")
    recipient_contact = Column(String(64))

    resolution_category = Column(String(255))
    resolution_reason = Column(Text)
    duration_text = Column(String(64))
    mttr_minutes = Column(Integer)
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    comments = relationship("TicketComment", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketComment.created_at.desc()")


class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id = Column(String(64), primary_key=True)
    ticket_id = Column(String(64), ForeignKey("incident_tickets.id"), nullable=False)
    author = Column(String(255), nullable=False)
    role = Column(String(64), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    ticket = relationship("IncidentTicket", back_populates="comments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True)
    action = Column(String(64), nullable=False)
    details = Column(Text, nullable=False)
    entity_type = Column(String(64))
    entity_id = Column(String(64))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class TelephonyCall(Base):
    __tablename__ = "telephony_calls"

    id = Column(String(64), primary_key=True)
    provider = Column(String(64), default="exotel_mock")
    provider_call_id = Column(String(128), unique=True)
    caller_phone = Column(String(32), nullable=False)
    dialed_number = Column(String(32), default="1912")
    status = Column(String(32), default="COMPLETED")
    matched_hub_id = Column(String(64))
    matched_usc_number = Column(String(64))
    ticket_id = Column(String(64))
    locality = Column(String(255))
    duration_seconds = Column(Integer, default=45)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CallTranscriptSegment(Base):
    __tablename__ = "call_transcript_segments"

    id = Column(String(64), primary_key=True)
    call_id = Column(String(64), ForeignKey("telephony_calls.id"), nullable=False)
    sequence_no = Column(Integer, nullable=False)
    speaker = Column(String(32), nullable=False)
    text = Column(Text, nullable=False)
    timestamp_offset = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AiDiagnosis(Base):
    __tablename__ = "ai_diagnoses"

    id = Column(String(64), primary_key=True)
    ticket_id = Column(String(64), ForeignKey("incident_tickets.id"), nullable=False)
    scenario_key = Column(String(64), nullable=False)
    primary_hypothesis_title = Column(String(255), nullable=False)
    confidence_score = Column(Float, default=95.0)
    description = Column(Text, nullable=False)
    evidence_tags = Column(JSON, default=list)
    recommended_verification = Column(JSON, default=list)
    guardrails_applied = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(32), nullable=True)
    employee_id = Column(String(64), nullable=True)
    role = Column(String(64), default="NOC_OPERATOR")  # NOC_OPERATOR, SECTION_ENGINEER, FIELD_LINEMAN, ADMIN
    section_office = Column(String(128), default="Cybercity Division, TSSPDCL")
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


