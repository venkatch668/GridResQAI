from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from server.database.session import get_db
from server.models.entities import Substation, Feeder, DistributionTransformer, ServiceConnection
from server.schemas.api import SubstationOut, FeederOut, TransformerOut
from server.realtime.broadcaster import broadcaster

router = APIRouter(prefix="/api/topology", tags=["Topology"])


@router.get("/substations", response_model=List[SubstationOut])
def get_substations(db: Session = Depends(get_db)):
    """Fetch all 33/11kV substations with child feeders and DTRs."""
    substations = (
        db.query(Substation)
        .options(
            joinedload(Substation.feeders).joinedload(Feeder.transformers)
        )
        .all()
    )
    return substations


@router.get("/feeders", response_model=List[FeederOut])
def get_feeders(
    substation_id: Optional[str] = Query(None, description="Filter by Substation ID"),
    db: Session = Depends(get_db)
):
    """Fetch 11kV feeders with connected distribution transformers."""
    query = db.query(Feeder).options(joinedload(Feeder.transformers))
    if substation_id:
        query = query.filter(Feeder.substation_id == substation_id)
    return query.all()


@router.get("/transformers", response_model=List[TransformerOut])
def get_transformers(
    feeder_id: Optional[str] = Query(None, description="Filter by Feeder ID"),
    db: Session = Depends(get_db)
):
    """Fetch Distribution Transformers (DTRs)."""
    query = db.query(DistributionTransformer)
    if feeder_id:
        query = query.filter(DistributionTransformer.feeder_id == feeder_id)
    return query.all()


@router.get("/transformers/{dtr_id}", response_model=TransformerOut)
def get_transformer_by_id(dtr_id: str, db: Session = Depends(get_db)):
    """Fetch single transformer telemetry details."""
    dtr = db.query(DistributionTransformer).filter(DistributionTransformer.id == dtr_id).first()
    if not dtr:
        raise HTTPException(status_code=404, detail="Transformer not found")
    return dtr


@router.post("/transformers/{dtr_id}/simulate-trip")
async def simulate_transformer_trip(dtr_id: str, db: Session = Depends(get_db)):
    """Simulate a trip / fault on a Distribution Transformer for testing."""
    dtr = db.query(DistributionTransformer).filter(DistributionTransformer.id == dtr_id).first()
    if not dtr:
        raise HTTPException(status_code=404, detail="Transformer not found")

    dtr.simulated_state = "FAILED"
    dtr.telemetry_status = "TRIPPED: Overcurrent / Earth Fault on LT Bus"
    dtr.voltage_r = 0.0
    dtr.voltage_y = 0.0
    dtr.voltage_b = 0.0
    dtr.consumers_affected = 420
    db.commit()

    # Broadcast event
    await broadcaster.broadcast("dtr_state_changed", "transformer", {
        "id": dtr.id,
        "dtr_code": dtr.dtr_code,
        "name": dtr.name,
        "simulated_state": "FAILED",
        "telemetry_status": dtr.telemetry_status,
        "consumers_affected": dtr.consumers_affected
    })

    return {"message": f"Transformer {dtr.name} simulated trip triggered", "status": "FAILED"}


@router.post("/transformers/{dtr_id}/simulate-restore")
async def simulate_transformer_restore(dtr_id: str, db: Session = Depends(get_db)):
    """Simulate power restoration on a Distribution Transformer."""
    dtr = db.query(DistributionTransformer).filter(DistributionTransformer.id == dtr_id).first()
    if not dtr:
        raise HTTPException(status_code=404, detail="Transformer not found")

    dtr.simulated_state = "HEALTHY"
    dtr.telemetry_status = "Nominal (240V Phase-Neutral)"
    dtr.voltage_r = 240.0
    dtr.voltage_y = 241.0
    dtr.voltage_b = 239.0
    dtr.consumers_affected = 0
    db.commit()

    # Broadcast event
    await broadcaster.broadcast("dtr_state_changed", "transformer", {
        "id": dtr.id,
        "dtr_code": dtr.dtr_code,
        "name": dtr.name,
        "simulated_state": "HEALTHY",
        "telemetry_status": dtr.telemetry_status,
        "consumers_affected": 0
    })

    return {"message": f"Transformer {dtr.name} restored to healthy", "status": "HEALTHY"}

