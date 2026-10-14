import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.config import settings
from server.database.session import engine, Base
from server.routers import (
    auth,
    incidents,
    crews,
    topology,
    telephony,
    diagnosis,
    realtime
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("gridresq-server")

# Auto-create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GridResQ - TSSPDCL Hyderabad Operations API",
    description="Real-time Outage Management & Lineman Dispatch Backend for TSSPDCL Cybercity Division",
    version="1.0.0"
)

# Enable CORS for frontend clients (Vite dev server, production builds)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router)
app.include_router(incidents.router)
app.include_router(crews.router)
app.include_router(topology.router)
app.include_router(telephony.router)
app.include_router(diagnosis.router)
app.include_router(realtime.router)



@app.get("/api/health")
def health_check():
    """Health check endpoint indicating server and database status."""
    return {
        "status": "HEALTHY",
        "service": "GridResQ API",
        "division": "TSSPDCL Cybercity Division, Hyderabad",
        "database_url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL
    }


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting GridResQ FastAPI server on port 8000...")
    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)

