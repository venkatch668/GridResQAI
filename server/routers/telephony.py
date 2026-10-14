import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from server.database.session import get_db
from server.models.entities import TelephonyCall, CallTranscriptSegment, Feeder
from server.realtime.broadcaster import broadcaster

router = APIRouter(prefix="/api/telephony", tags=["Telephony"])


class TranscriptSegmentOut(BaseModel):
    id: str
    sequence_no: int
    speaker: str
    text: str
    timestamp_offset: str

    class Config:
        from_attributes = True


class TelephonyCallOut(BaseModel):
    id: str
    provider: str
    caller_phone: str
    dialed_number: str
    status: str
    matched_hub_id: Optional[str] = None
    matched_usc_number: Optional[str] = None
    ticket_id: Optional[str] = None
    locality: Optional[str] = None
    duration_seconds: int
    started_at: datetime.datetime
    ended_at: Optional[datetime.datetime] = None
    transcripts: List[TranscriptSegmentOut] = []

    class Config:
        from_attributes = True


class SimulateCallIn(BaseModel):
    caller_phone: Optional[str] = "+91 98490 12345"
    locality: Optional[str] = "Madhapur Cyber Hills"
    matched_usc_number: Optional[str] = "USC-10492817"
    issue_description: Optional[str] = "Complete blackout observed since 15 minutes, transformer spark heard near DTR-04."


@router.get("/calls")
def get_recent_calls(db: Session = Depends(get_db)):
    """Fetch recent mock helpline and IVR call sessions."""
    calls = db.query(TelephonyCall).order_by(TelephonyCall.created_at.desc()).limit(20).all()
    result = []
    for c in calls:
        transcripts = (
            db.query(CallTranscriptSegment)
            .filter(CallTranscriptSegment.call_id == c.id)
            .order_by(CallTranscriptSegment.sequence_no.asc())
            .all()
        )
        result.append({
            "id": c.id,
            "provider": c.provider,
            "caller_phone": c.caller_phone,
            "dialed_number": c.dialed_number,
            "status": c.status,
            "matched_hub_id": c.matched_hub_id,
            "matched_usc_number": c.matched_usc_number,
            "ticket_id": c.ticket_id,
            "locality": c.locality,
            "duration_seconds": c.duration_seconds,
            "started_at": c.started_at,
            "ended_at": c.ended_at,
            "transcripts": [
                {
                    "id": t.id,
                    "sequence_no": t.sequence_no,
                    "speaker": t.speaker,
                    "text": t.text,
                    "timestamp_offset": t.timestamp_offset
                }
                for t in transcripts
            ]
        })
    return result


@router.post("/simulate")
async def simulate_incoming_call(payload: SimulateCallIn, db: Session = Depends(get_db)):
    """Simulate an incoming IVR 1912 customer outage report call."""
    call_id = f"CALL-{str(uuid.uuid4())[:8].upper()}"
    now = datetime.datetime.utcnow()

    feeder = db.query(Feeder).first()
    matched_hub_id = feeder.id if feeder else None

    call = TelephonyCall(
        id=call_id,
        provider="exotel_mock",
        provider_call_id=f"EXO-{str(uuid.uuid4())[:12]}",
        caller_phone=payload.caller_phone or "+91 98490 12345",
        dialed_number="1912",
        status="IN_PROGRESS",
        matched_hub_id=matched_hub_id,
        matched_usc_number=payload.matched_usc_number,
        locality=payload.locality,
        duration_seconds=52,
        started_at=now,
        created_at=now
    )
    db.add(call)
    db.flush()

    # Add mock transcripts
    segments = [
        CallTranscriptSegment(
            id=str(uuid.uuid4()),
            call_id=call_id,
            sequence_no=1,
            speaker="AI_AGENT",
            text="Namaskaram. Welcome to TSSPDCL Cybercity Electricity Helpline. How can we assist you?",
            timestamp_offset="00:02"
        ),
        CallTranscriptSegment(
            id=str(uuid.uuid4()),
            call_id=call_id,
            sequence_no=2,
            speaker="CALLER",
            text=payload.issue_description or "Power is completely gone in our street and heard a spark near transformer.",
            timestamp_offset="00:15"
        ),
        CallTranscriptSegment(
            id=str(uuid.uuid4()),
            call_id=call_id,
            sequence_no=3,
            speaker="AI_AGENT",
            text=f"Understood. We verified your connection {payload.matched_usc_number}. Line ticket created. Gang dispatched.",
            timestamp_offset="00:38"
        )
    ]
    for seg in segments:
        db.add(seg)

    db.commit()

    # Broadcast event
    await broadcaster.broadcast("call_received", "telephony", {
        "call_id": call_id,
        "caller_phone": call.caller_phone,
        "locality": call.locality,
        "matched_usc_number": call.matched_usc_number,
        "status": "IN_PROGRESS"
    })

    return {
        "message": "Simulated call processed successfully",
        "id": call_id,
        "call_id": call_id,
        "caller_phone": call.caller_phone,
        "locality": call.locality,
        "status": "IN_PROGRESS"
    }

