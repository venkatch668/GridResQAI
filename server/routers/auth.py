import uuid
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from server.database.session import get_db
from server.models.entities import User
from server.schemas.api import UserSignupIn, UserLoginIn, UserOut, AuthResponse
from server.auth.security import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def seed_default_users(db: Session):
    """Seed default demonstration operator, engineer and lineman accounts if users table is empty."""
    count = db.query(User).count()
    if count == 0:
        demo_users = [
            User(
                id="usr-op-842",
                email="ramesh.varma@tsspdcl.gov.in",
                password_hash=hash_password("Password123!"),
                full_name="Operator Ramesh Varma",
                phone="+91 94906 18001",
                employee_id="OP-842",
                role="NOC_OPERATOR",
                section_office="Cybercity Division Operations NOC",
                created_at=datetime.datetime.utcnow()
            ),
            User(
                id="usr-ae-104",
                email="srinivas.reddy@tsspdcl.gov.in",
                password_hash=hash_password("Password123!"),
                full_name="K. Srinivas Reddy (AE / Op)",
                phone="+91 94906 18201",
                employee_id="AE-104",
                role="SECTION_ENGINEER",
                section_office="Madhapur Section, TSSPDCL",
                created_at=datetime.datetime.utcnow()
            ),
            User(
                id="usr-lm-302",
                email="ramulu.k@tsspdcl.gov.in",
                password_hash=hash_password("Password123!"),
                full_name="K. Ramulu (Senior Lineman)",
                phone="+91 94408 12301",
                employee_id="LM-302",
                role="FIELD_LINEMAN",
                section_office="Madhapur Emergency Squad",
                created_at=datetime.datetime.utcnow()
            ),
        ]
        db.add_all(demo_users)
        db.commit()


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignupIn, db: Session = Depends(get_db)):
    """Register a new TSSPDCL Operator, Section Engineer or Lineman account."""
    seed_default_users(db)

    email_clean = payload.email.strip().lower()
    existing = db.query(User).filter(func.lower(User.email) == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    new_user = User(
        id=user_id,
        email=email_clean,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        phone=payload.phone.strip() if payload.phone else None,
        role=payload.role or "NOC_OPERATOR",
        section_office=payload.section_office or "Cybercity Division, TSSPDCL",
        employee_id=payload.employee_id.strip() if payload.employee_id else f"EMP-{uuid.uuid4().hex[:4].upper()}",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({
        "sub": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "name": new_user.full_name
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=new_user
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLoginIn, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive a JWT access token."""
    seed_default_users(db)

    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid TSSPDCL email address or password."
        )

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.full_name
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )


@router.get("/me", response_model=UserOut)
def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Fetch currently authenticated user profile from Authorization header."""
    seed_default_users(db)

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header."
        )

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or token invalid. Please log in again."
        )

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    return user

