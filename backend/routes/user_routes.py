from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/search", response_model=dict)
def search_users(
    q: str = Query("", description="Query string for username, email or status"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clean_q = q.strip().lower().lstrip("@")
    query = db.query(models.User).filter(models.User.id != current_user.id)
    
    if clean_q:
        query = query.filter(
            (models.User.username.ilike(f"%{clean_q}%")) |
            (models.User.email.ilike(f"%{clean_q}%")) |
            (models.User.custom_status.ilike(f"%{clean_q}%"))
        )

    users = query.limit(20).all()
    return {"users": users}

@router.get("/{user_id}", response_model=dict)
def get_user_by_id(
    user_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"user": user}
