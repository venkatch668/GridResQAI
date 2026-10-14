import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "server" / ".env")

DEFAULT_SQLITE_URL = f"sqlite:///{BASE_DIR / 'gridresq.db'}"



class Settings:
    APP_NAME: str = "GridResQ AI Operations Engine"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)
    CORS_ORIGINS: list[str] = ["*"]
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

settings = Settings()
