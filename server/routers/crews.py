import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database.session import get_db
from server.models.entities import (
    SectionGang, LinemanTechnician, IncidentTicket, TicketComment, AuditLog
)
from server.schemas.api import (
    CrewOut, LinemanOut, AssignOutageToLinemanIn, RealtimeEvent
)
from server.realtime.broadcaster import broadcaster

router = APIRouter(prefix="/api", tags=["Field Crews & Technicians"])

@router.get("/crews", response_model=List[CrewOut])
def list_crews(
    status: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(SectionGang)

    if status and status != "ALL":
        if status == "AVAILABLE":
            query = query.filter(SectionGang.status == "AVAILABLE")
        elif status == "DISPATCHED":
            query = query.filter(SectionGang.status.in_(["DISPATCHED", "ON_SITE"]))

    if section and section != "ALL":
        query = query.filter(SectionGang.section_office.ilike(f"%{section}%"))

    if search and search.strip():
        q = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SectionGang.name.ilike(q),
                SectionGang.vehicle_number.ilike(q),
                SectionGang.lead_name.ilike(q),
                SectionGang.current_location_text.ilike(q)
            )
        )

    return query.all()


@router.get("/technicians", response_model=List[LinemanOut])
def list_technicians(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(LinemanTechnician)
    if status and status != "ALL":
        query = query.filter(LinemanTechnician.status == status)
    return query.all()


@router.post("/technicians/{tech_id}/assign", response_model=LinemanOut)
async def assign_technician_to_ticket(tech_id: str, payload: AssignOutageToLinemanIn, db: Session = Depends(get_db)):
    tech = db.query(LinemanTechnician).filter(LinemanTechnician.id == tech_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")

    ticket = db.query(IncidentTicket).filter(IncidentTicket.id == payload.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Incident ticket not found")

    gang = db.query(SectionGang).filter(SectionGang.id == tech.gang_id).first()
    now = datetime.datetime.utcnow()

    # Update technician
    tech.status = "ASSIGNED"
    tech.assigned_ticket_id = ticket.id
    tech.assigned_ticket_number = ticket.ticket_number
    tech.assigned_task_description = ticket.summary
    tech.assigned_at = now

    # Update gang
    if gang:
        gang.status = "DISPATCHED"
        gang.speed_kmph = 38
        gang.assigned_incident_id = ticket.id
        gang.assigned_ticket_number = ticket.ticket_number
        gang.assigned_task_description = ticket.summary
        gang.current_location_text = f"{ticket.locality} (En Route)"
        gang.assigned_at = now

    # Update ticket
    ticket.allocated_technician_id = tech.id
    ticket.assigned_technician_name = tech.name
    ticket.assigned_technician_role = tech.role
    ticket.assigned_technician_phone = tech.phone

    if gang:
        ticket.allocated_crew_id = gang.id
        ticket.assigned_crew_name = gang.name
        ticket.assigned_crew_lead = gang.lead_name
        ticket.assigned_crew_vehicle = gang.vehicle_number
        ticket.assigned_crew_phone = gang.contact_phone

    if ticket.status == "OPEN":
        ticket.status = "IN_PROGRESS"
    ticket.updated_at = now

    # Activity comment
    comm = TicketComment(
        id=f"c-{uuid.uuid4().hex[:8]}",
        ticket_id=ticket.id,
        author="NOC Dispatch Control",
        role="OPERATOR",
        content=f"Dispatched Field Technician {tech.name} ({tech.role}, {tech.phone}) from {gang.name if gang else 'Squad'}.",
        created_at=now
    )
    db.add(comm)

    # Audit log
    audit = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:8]}",
        action="TECH_ASSIGNED",
        details=f"Assigned {tech.name} ({tech.role}) to {ticket.ticket_number}.",
        entity_type="TECHNICIAN",
        entity_id=tech.id
    )
    db.add(audit)
    db.commit()
    db.refresh(tech)

    await broadcaster.publish(RealtimeEvent(event_type="TECH_ASSIGNED", entity="TECHNICIAN", data={"technician_id": tech.id, "ticket_id": ticket.id}))
    return tech


@router.post("/technicians/{tech_id}/release", response_model=LinemanOut)
async def release_technician(tech_id: str, db: Session = Depends(get_db)):
    tech = db.query(LinemanTechnician).filter(LinemanTechnician.id == tech_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")

    prev_ticket = tech.assigned_ticket_number or "Outage"
    gang = db.query(SectionGang).filter(SectionGang.id == tech.gang_id).first()

    tech.status = "AVAILABLE"
    tech.assigned_ticket_id = None
    tech.assigned_ticket_number = None
    tech.assigned_task_description = None
    tech.assigned_at = None

    if gang:
        # Check if other members are assigned
        busy_member = db.query(LinemanTechnician).filter(
            LinemanTechnician.gang_id == gang.id,
            LinemanTechnician.status == "ASSIGNED"
        ).first()
        if not busy_member:
            gang.status = "AVAILABLE"
            gang.speed_kmph = 0
            gang.current_location_text = gang.base_depot
            gang.assigned_incident_id = None
            gang.assigned_ticket_number = None
            gang.assigned_task_description = None
            gang.assigned_at = None

    audit = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:8]}",
        action="TECH_RELEASED",
        details=f"Technician {tech.name} released from {prev_ticket}. Restored to AVAILABLE status.",
        entity_type="TECHNICIAN",
        entity_id=tech.id
    )
    db.add(audit)
    db.commit()
    db.refresh(tech)

    await broadcaster.publish(RealtimeEvent(event_type="TECH_RELEASED", entity="TECHNICIAN", data={"technician_id": tech.id}))
    return tech


@router.post("/crews/{crew_id}/mark-on-site", response_model=CrewOut)
async def mark_crew_on_site(crew_id: str, db: Session = Depends(get_db)):
    gang = db.query(SectionGang).filter(SectionGang.id == crew_id).first()
    if not gang:
        raise HTTPException(status_code=404, detail="Section gang not found")

    now = datetime.datetime.utcnow()
    gang.status = "ON_SITE"
    gang.speed_kmph = 0
    gang.current_location_text = "On-Site Fault Location"
    gang.updated_at = now

    if gang.assigned_incident_id:
        comm = TicketComment(
            id=f"c-{uuid.uuid4().hex[:8]}",
            ticket_id=gang.assigned_incident_id,
            author=gang.lead_name,
            role="FIELD_CREW",
            content=f"{gang.name} arrived on site. Vehicle stationed. Commencing diagnostics.",
            created_at=now
        )
        db.add(comm)

    audit = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:8]}",
        action="CREW_ON_SITE",
        details=f"{gang.name} arrived on site at {gang.current_location_text}.",
        entity_type="GANG",
        entity_id=gang.id
    )
    db.add(audit)
    db.commit()
    db.refresh(gang)

    await broadcaster.publish(RealtimeEvent(event_type="CREW_ON_SITE", entity="GANG", data={"crew_id": gang.id}))
    return gang
