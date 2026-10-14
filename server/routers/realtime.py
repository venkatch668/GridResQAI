from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from server.realtime.broadcaster import broadcaster

router = APIRouter(prefix="/api/realtime", tags=["Realtime"])


@router.get("/stream")
async def sse_event_stream():
    """Server-Sent Events (SSE) live push stream for tickets, technician allocations, and grid telemetry."""
    return StreamingResponse(
        broadcaster.subscribe(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        }
    )

