import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database.session import get_db
from server.models.entities import (
    IncidentTicket, TicketComment, LinemanTechnician, SectionGang, AuditLog
)
from server.schemas.api import (
    TicketOut, TicketCreate, AssignTechnicianIn, ResolveTicketIn, EscalateTicketIn,
    CommentCreate, CommentOut, RealtimeEvent
)
from server.realtime.broadcaster import broadcaster

router = APIRouter(prefix="/api/tickets", tags=["Incident Tickets"])

@router.get("", response_model=List[TicketOut])
def list_tickets(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(IncidentTicket)

    if status and status != "ALL":
        if status == "ACTIVE":
            query = query.filter(IncidentTicket.status.in_(["OPEN", "IN_PROGRESS"]))
        else:
            query = query.filter(IncidentTicket.status == status)

    if priority and priority != "ALL":
        query = query.filter(IncidentTicket.priority == priority)

    if section and section != "ALL":
        query = query.filter(IncidentTicket.section_office.ilike(f"%{section}%"))

    if search and search.strip():
        q = f"%{search.strip()}%"
        query = query.filter(
            or_(
                IncidentTicket.ticket_number.ilike(q),
                IncidentTicket.summary.ilike(q),
                IncidentTicket.locality.ilike(q),
                IncidentTicket.primary_asset_code.ilike(q),
                IncidentTicket.service_connection_no.ilike(q),
                IncidentTicket.assigned_technician_name.ilike(q),
                IncidentTicket.assigned_crew_name.ilike(q)
            )
        )

    return query.order_by(IncidentTicket.created_at.desc()).all()


def find_ticket(db: Session, ticket_id: str) -> Optional[IncidentTicket]:
    return db.query(IncidentTicket).filter(
        or_(IncidentTicket.id == ticket_id, IncidentTicket.ticket_number == ticket_id)
    ).first()


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    t = find_ticket(db, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="Incident ticket not found")
    return t



@router.post("", response_model=TicketOut)
async def create_ticket(payload: TicketCreate, db: Session = Depends(get_db)):
    tid = f"tkt-{uuid.uuid4().hex[:6]}"
    ticket = IncidentTicket(
        id=tid,
        **payload.model_dump(),
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(ticket)

    # Initial AI Triage comment
    comment = TicketComment(
        id=f"c-{uuid.uuid4().hex[:8]}",
        ticket_id=tid,
        author="AI Triage Agent",
        role="AI_SYSTEM",
        content=f"Telemetry verification: Outage logged for {ticket.primary_asset_code} at {ticket.locality}.",
        created_at=datetime.datetime.utcnow()
    )
    db.add(comment)

    audit = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:8]}",
        action="TICKET_CREATED",
        details=f"Created ticket {ticket.ticket_number} for {ticket.locality}.",
        entity_type="TICKET",
        entity_id=tid
    )
    db.add(audit)
    db.commit()
    db.refresh(ticket)

    await broadcaster.publish(RealtimeEvent(event_type="TICKET_CREATED", entity="TICKET", data={"ticket_id": tid}))
    return ticket


@router.post("/{ticket_id}/assign-technician", response_model=TicketOut)
async def assign_technician(ticket_id: str, payload: AssignTechnicianIn, db: Session = Depends(get_db)):
    ticket = find_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    tech = db.query(LinemanTechnician).filter(
        or_(LinemanTechnician.id == payload.technician_id, LinemanTechnician.name.ilike(f"%{payload.technician_id}%"))
    ).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")


    gang = db.query(SectionGang).filter(SectionGang.id == tech.gang_id).first()
    now = datetime.datetime.utcnow()

    # Update technician state
    tech.status = "ASSIGNED"
    tech.assigned_ticket_id = ticket.id
    tech.assigned_ticket_number = ticket.ticket_number
    tech.assigned_task_description = ticket.summary
    tech.assigned_at = now

    # Update parent section gang
    if gang:
        gang.status = "DISPATCHED"
        gang.speed_kmph = 38
        gang.assigned_incident_id = ticket.id
        gang.assigned_ticket_number = ticket.ticket_number
        gang.assigned_task_description = ticket.summary
        gang.current_location_text = f"{ticket.locality} (En Route)"
        gang.assigned_at = now

    # Update ticket fields
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
        content=f"Assigned Field Technician {tech.name} ({tech.role}, {tech.phone}) from {gang.name if gang else 'Squad'}. Vehicle: {gang.vehicle_number if gang else 'Fleet'}.",
        created_at=now
    )
    db.add(comm)

    # Audit log
    audit = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:8]}",
        action="TECH_ASSIGNED",
        details=f"Assigned {tech.name} to {ticket.ticket_number}.",
        entity_type="TECHNICIAN",
        entity_id=tech.id
    )
    db.add(audit)
    db.commit()
    db.refresh(ticket)

    await broadcaster.publish(RealtimeEvent(event_type="TECH_ASSIGNED", entity="TICKET", data={"ticket_id": ticket.id, "technician_id": tech.id}))
    return ticket


@router.post("/{ticket_id}/resolve", response_model=TicketOut)
async def resolve_ticket(ticket_id: str, payload: ResolveTicketIn, db: Session = Depends(get_db)):
    ticket = find_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    now = datetime.datetime.utcnow()
    ticket.status = "RESOLVED"
    ticket.resolution_category = payload.category
    ticket.resolution_reason = payload.reason
    ticket.resolved_at = now
    ticket.duration_text = "Resolved Just Now"
    ticket.updated_at = now

    # Release assigned technician if any
    if ticket.allocated_technician_id:
        tech = db.query(LinemanTechnician).filter(LinemanTechnician.id == ticket.allocated_technician_id).first()
        if tech:
            tech.status = "AVAILABLE"
            tech.assigned_ticket_id = None
            tech.assigned_ticket_number = None
            tech.assigned_task_description = None
            tech.assigned_at = None

    # Release gang if no other members active
    if ticket.allocated_crew_id:
        gang = db.query(SectionGang).filter(SectionGang.id == ticket.allocated_crew_id).first()
        if gang:
            other_busy = db.query(LinemanTechnician).filter(
                LinemanTechnician.gang_id == gang.id,
                LinemanTechnician.status == "ASSIGNED"
            ).first()
            if not other_busy:
                gang.status = "AVAILABLE"
                gang.speed_kmph = 0
                gang.current_location_text = gang.base_depot
                gang.assigned_incident_id = None
                gang.assigned_ticket_number = None
                gang.assigned_task_description = None
                gang.assigned_at = None

    # Comment
    comm = TicketComment(
        id=f"c-{uuid.uuid4().hex[:8]}",
        ticket_id=ticket.id,
        author=payload.operator_name or "Operator",
        role="OPERATOR",
        content=f"Ticket marked RESOLVED. Category: {payload.category}. Remarks: {payload.reason}",
        created_at=now
    )
    db.add(comm)

    audit = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:8]}",
        action="TICKET_RESOLVED",
        details=f"Ticket {ticket.ticket_number} resolved by {payload.operator_name}. Category: {payload.category}.",
        entity_type="TICKET",
        entity_id=ticket.id
    )
    db.add(audit)
    db.commit()
    db.refresh(ticket)

    await broadcaster.publish(RealtimeEvent(event_type="TICKET_RESOLVED", entity="TICKET", data={"ticket_id": ticket.id}))
    return ticket


@router.post("/{ticket_id}/reopen", response_model=TicketOut)
async def reopen_ticket(ticket_id: str, db: Session = Depends(get_db)):
    ticket = find_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    now = datetime.datetime.utcnow()
    ticket.status = "OPEN"
    ticket.resolved_at = None
    ticket.updated_at = now

    comm = TicketComment(
        id=f"c-{uuid.uuid4().hex[:8]}",
        ticket_id=ticket.id,
        author="NOC Operator",
        role="OPERATOR",
        content="Ticket re-opened: Consumer reported persistent fluctuations.",
        created_at=now
    )
    db.add(comm)
    db.commit()
    db.refresh(ticket)

    await broadcaster.publish(RealtimeEvent(event_type="TICKET_REOPENED", entity="TICKET", data={"ticket_id": ticket.id}))
    return ticket


@router.post("/{ticket_id}/escalate", response_model=TicketOut)
async def escalate_ticket(ticket_id: str, payload: EscalateTicketIn, db: Session = Depends(get_db)):
    ticket = find_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    now = datetime.datetime.utcnow()
    ticket.status = "ESCALATED"
    ticket.updated_at = now

    comm = TicketComment(
        id=f"c-{uuid.uuid4().hex[:8]}",
        ticket_id=ticket.id,
        author="NOC Operator",
        role="OPERATOR",
        content=payload.reason or "Escalated to Cybercity Divisional Engineer.",
        created_at=now
    )
    db.add(comm)
    db.commit()
    db.refresh(ticket)

    await broadcaster.publish(RealtimeEvent(event_type="TICKET_ESCALATED", entity="TICKET", data={"ticket_id": ticket.id}))
    return ticket


@router.post("/{ticket_id}/comments", response_model=CommentOut)
async def add_comment(ticket_id: str, payload: CommentCreate, db: Session = Depends(get_db)):
    ticket = find_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")


    now = datetime.datetime.utcnow()
    comm = TicketComment(
        id=f"c-{uuid.uuid4().hex[:8]}",
        ticket_id=ticket.id,
        author=payload.author,
        role=payload.role,
        content=payload.content,
        created_at=now
    )
    db.add(comm)
    db.commit()
    db.refresh(comm)

    await broadcaster.publish(RealtimeEvent(event_type="COMMENT_ADDED", entity="TICKET", data={"ticket_id": ticket.id, "comment_id": comm.id}))
    return comm
