from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_password_hash, verify_password, create_access_token, get_current_user
import re

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    clean_username = payload.username.strip().lower().lstrip("@")
    clean_email = payload.email.strip().lower()

    if len(clean_username) < 3 or len(clean_username) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O nome de usuário deve ter entre 3 e 20 caracteres."
        )

    if not re.match("^[a-zA-Z0-9_]+$", clean_username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O nome de usuário pode conter apenas letras, números e sublinhados (_)."
        )

    if payload.confirmPassword and payload.password != payload.confirmPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha e a confirmação de senha não coincidem."
        )

    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve ter pelo menos 6 caracteres."
        )

    # Check unique username
    if db.query(models.User).filter(models.User.username == clean_username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este nome de usuário já está em uso."
        )

    # Check unique email
    if db.query(models.User).filter(models.User.email == clean_email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado."
        )

    new_user = models.User(
        username=clean_username,
        email=clean_email,
        password_hash=get_password_hash(payload.password),
        avatar=f"https://api.dicebear.com/7.x/bottts/svg?seed={clean_username}&backgroundColor=1a0d0d",
        status="online",
        custom_status="Explorando o RedChat 🔴",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"id": new_user.id, "username": new_user.username, "email": new_user.email})

    return {
        "message": "Cadastro realizado com sucesso!",
        "token": token,
        "user": new_user,
    }

@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    clean_identifier = payload.identifier.strip().lower().lstrip("@")

    # Detect username vs email
    user = db.query(models.User).filter(
        (models.User.username == clean_identifier) | (models.User.email == clean_identifier)
    ).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário/e-mail ou senha incorretos."
        )

    user.status = "online"
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"id": user.id, "username": user.username, "email": user.email})

    return {
        "message": "Login realizado com sucesso!",
        "token": token,
        "user": user,
    }

@router.get("/me", response_model=dict)
def get_me(current_user: models.User = Depends(get_current_user)):
    return {"user": current_user}

@router.put("/me", response_model=dict)
def update_me(
    payload: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.username:
        clean = payload.username.strip().lower().lstrip("@")
        existing = db.query(models.User).filter(models.User.username == clean).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Nome de usuário já em uso.")
        current_user.username = clean

    if payload.avatar is not None:
        current_user.avatar = payload.avatar
    if payload.status is not None:
        current_user.status = payload.status
    if payload.custom_status is not None:
        current_user.custom_status = payload.custom_status
    if payload.bio is not None:
        current_user.bio = payload.bio

    db.commit()
    db.refresh(current_user)

    return {"message": "Perfil atualizado com sucesso!", "user": current_user}
