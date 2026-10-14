import uuid
import datetime
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_
from server.database.session import get_db
from server.models.entities import IncidentTicket, AiDiagnosis
from server.realtime.broadcaster import broadcaster

router = APIRouter(prefix="/api/diagnosis", tags=["AI Diagnosis"])


class AiDiagnosisOut(BaseModel):
    id: str
    ticket_id: str
    scenario_key: str
    primary_hypothesis_title: str
    confidence_score: float
    description: str
    evidence_tags: List[Any] = []
    recommended_verification: List[Any] = []
    guardrails_applied: List[Any] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True


@router.get("/{ticket_id}", response_model=AiDiagnosisOut)
def get_diagnosis_by_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """Fetch AI causal root cause diagnosis for a ticket."""
    ticket = db.query(IncidentTicket).filter(
        or_(IncidentTicket.id == ticket_id, IncidentTicket.ticket_number == ticket_id)
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Incident ticket not found")

    diag = db.query(AiDiagnosis).filter(AiDiagnosis.ticket_id == ticket.id).first()
    if diag:
        return diag


    # Provide fallback realistic mock diagnosis if not yet generated
    mock_diag = AiDiagnosis(
        id=f"DIAG-{str(uuid.uuid4())[:8].upper()}",
        ticket_id=ticket.id,
        scenario_key="TRANSFORMER_OVERHEATING_OR_PHASE_TRIP",
        primary_hypothesis_title=f"Asymmetric Phase Voltage Dip on {ticket.primary_asset_code}",
        confidence_score=94.2,
        description=(
            f"Automated SCADA cross-correlation detected 34 smart meters reporting zero-voltage simultaneously "
            f"under {ticket.primary_asset_code} ({ticket.locality}). 11kV Feeder protection relay recorded 420A peak transient."
        ),
        evidence_tags=[
            {"tag": "SCADA Trip Telemetry", "status": "VERIFIED"},
            {"tag": "AMI Meter Heartbeat Silence", "count": 34},
            {"tag": "Consumer 1912 IVR Spike", "count": 12}
        ],
        recommended_verification=[
            "Inspect LT bushing terminals for insulation flashover",
            "Verify HT horn gap fuse continuity and earth electrode resistance",
            "Perform IR megger test before closing feeder circuit breaker"
        ],
        guardrails_applied=[
            "Restricted autonomous reclosure: Manual lineman clearance mandatory",
            "Safety protocol: High-voltage lockout enforced"
        ],
        created_at=datetime.datetime.utcnow()
    )
    db.add(mock_diag)
    db.commit()
    db.refresh(mock_diag)
    return mock_diag


@router.post("/{ticket_id}/re-evaluate", response_model=AiDiagnosisOut)
async def reevaluate_diagnosis(ticket_id: str, db: Session = Depends(get_db)):
    """Re-run AI causal diagnosis model (mock simulation)."""
    ticket = db.query(IncidentTicket).filter(IncidentTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Incident ticket not found")

    diag = db.query(AiDiagnosis).filter(AiDiagnosis.ticket_id == ticket_id).first()
    if not diag:
        diag = AiDiagnosis(id=f"DIAG-{str(uuid.uuid4())[:8].upper()}", ticket_id=ticket.id)
        db.add(diag)

    diag.scenario_key = "UPDATED_AI_SYNTHESIS"
    diag.primary_hypothesis_title = f"Verified Phase-to-Ground Fault on {ticket.primary_asset_code}"
    diag.confidence_score = 97.8
    diag.description = (
        f"Updated model inference after lineman telemetry input: "
        f"Localized tree branch contact on 11kV conductor span near {ticket.locality}."
    )
    diag.evidence_tags = [
        {"tag": "Line Sensor Acoustic Pulse", "status": "CONFIRMED"},
        {"tag": "AMI Zero-Crossing Delta", "status": "CONSISTENT"},
        {"tag": "Lineman Visual Confirmation", "status": "PENDING"}
    ]
    diag.recommended_verification = [
        "Tree branch pruning along span 14-16",
        "Visual insulator inspection for carbon tracking",
        "Line clearance certificate from Section Engineer"
    ]
    diag.guardrails_applied = [
        "Enforce PTW (Permit To Work) issue prior to re-energization"
    ]
    diag.created_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(diag)

    # Broadcast event
    await broadcaster.broadcast("diagnosis_updated", "ai_diagnosis", {
        "ticket_id": ticket_id,
        "hypothesis": diag.primary_hypothesis_title,
        "confidence_score": diag.confidence_score
    })

    return diag
