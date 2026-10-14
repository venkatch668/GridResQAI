from typing import Optional, List, Any
import datetime
from pydantic import BaseModel, Field

# --- Common / Comments ---
class CommentBase(BaseModel):
    author: str
    role: str
    content: str

class CommentCreate(CommentBase):
    pass

class CommentOut(CommentBase):
    id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Incident Tickets ---
class TicketBase(BaseModel):
    ticket_number: str
    service_connection_no: Optional[str] = None
    substation_name: str
    section_office: str
    primary_asset_type: str = "FEEDER"
    primary_asset_code: str
    priority: str = "P2_HIGH"
    status: str = "OPEN"
    summary: str
    locality: str
    consumers_affected: int = 0

class TicketCreate(TicketBase):
    pass

class TicketOut(TicketBase):
    id: str
    allocated_technician_id: Optional[str] = None
    assigned_technician_name: Optional[str] = None
    assigned_technician_role: Optional[str] = None
    assigned_technician_phone: Optional[str] = None
    allocated_crew_id: Optional[str] = None
    assigned_crew_name: Optional[str] = None
    assigned_crew_lead: Optional[str] = None
    assigned_crew_vehicle: Optional[str] = None
    assigned_crew_phone: Optional[str] = None
    assigned_operator_name: Optional[str] = None
    acknowledgement_channel: Optional[str] = None
    acknowledgement_status: Optional[str] = None
    recipient_contact: Optional[str] = None
    resolution_category: Optional[str] = None
    resolution_reason: Optional[str] = None
    duration_text: Optional[str] = None
    mttr_minutes: Optional[int] = None
    resolved_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    comments: List[CommentOut] = []

    class Config:
        from_attributes = True

class AssignTechnicianIn(BaseModel):
    technician_id: str

class ResolveTicketIn(BaseModel):
    category: str
    reason: str
    operator_name: Optional[str] = "Operator Ramesh Varma"

class EscalateTicketIn(BaseModel):
    reason: Optional[str] = "Escalated to Cybercity Divisional Engineer Breakdown Team."


# --- Crews & Linemen ---
class LinemanOut(BaseModel):
    id: str
    gang_id: str
    name: str
    role: str
    phone: str
    avatar_initials: str
    experience_text: str
    status: str
    assigned_ticket_id: Optional[str] = None
    assigned_ticket_number: Optional[str] = None
    assigned_task_description: Optional[str] = None
    assigned_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class CrewOut(BaseModel):
    id: str
    name: str
    short_name: str
    section_office: str
    specialization: str
    specialization_label: str
    vehicle_number: str
    vehicle_type: str
    base_depot: str
    current_location_text: str
    latitude: float
    longitude: float
    status: str
    speed_kmph: int
    eta_minutes: int
    lead_name: str
    lead_phone: str
    contact_phone: str
    assigned_incident_id: Optional[str] = None
    assigned_ticket_number: Optional[str] = None
    assigned_task_description: Optional[str] = None
    assigned_at: Optional[datetime.datetime] = None
    members: List[LinemanOut] = []

    class Config:
        from_attributes = True

class AssignOutageToLinemanIn(BaseModel):
    ticket_id: str


# --- Grid Topology ---
class TransformerOut(BaseModel):
    id: str
    feeder_id: str
    dtr_code: str
    name: str
    capacity_kva: int
    primary_voltage_v: int
    secondary_voltage_v: str
    simulated_state: str
    telemetry_status: str
    voltage_r: float
    voltage_y: float
    voltage_b: float
    neutral_voltage: float
    consumers_affected: int
    latitude: float
    longitude: float

    class Config:
        from_attributes = True

class FeederOut(BaseModel):
    id: str
    substation_id: str
    feeder_code: str
    name: str
    locality: str
    voltage_kv: float
    breaker_status: str
    simulated_state: str
    load_amps: float
    connected_dtrs_count: int
    connected_meters_count: int
    latitude: float
    longitude: float
    transformers: List[TransformerOut] = []

    class Config:
        from_attributes = True

class SubstationOut(BaseModel):
    id: str
    name: str
    voltage_kv: str
    circle: str
    division: str
    section_office: str
    latitude: float
    longitude: float
    status: str
    peak_load_mva: float
    incoming_lines_count: int
    feeders: List[FeederOut] = []

    class Config:
        from_attributes = True



# --- Realtime Broadcast Message ---
class RealtimeEvent(BaseModel):
    event_type: str
    entity: str
    data: Any
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)


# --- Authentication Schemas ---
class UserSignupIn(BaseModel):
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None
    role: Optional[str] = "NOC_OPERATOR"
    section_office: Optional[str] = "Cybercity Division, TSSPDCL"
    employee_id: Optional[str] = None

class UserLoginIn(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    section_office: str
    employee_id: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

