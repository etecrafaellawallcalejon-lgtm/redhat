from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from auth import get_current_user
from websocket import manager

router = APIRouter(tags=["chat"])

@router.get("/conversations", response_model=dict)
def get_conversations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find all conversations the user is part of
    convs = (
        db.query(models.Conversation)
        .join(models.conversation_participants)
        .filter(models.conversation_participants.c.user_id == current_user.id)
        .order_by(models.Conversation.updated_at.desc())
        .all()
    )

    result = []
    for conv in convs:
        partner = next((u for u in conv.participants if u.id != current_user.id), current_user)
        last_msg = db.query(models.Message).filter(models.Message.conversation_id == conv.id).order_by(models.Message.timestamp.desc()).first()
        unread_count = db.query(models.Message).filter(
            models.Message.conversation_id == conv.id,
            models.Message.recipient_id == current_user.id,
            models.Message.status != "read"
        ).count()

        result.append({
            "id": conv.id,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "partner": partner,
            "last_message": last_msg,
            "unread_count": unread_count
        })

    return {"conversations": result}

@router.post("/conversations", response_model=dict)
def create_or_get_conversation(
    payload: schemas.ConversationCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.recipient_id == current_user.id:
        raise HTTPException(status_code=400, detail="Não é possível iniciar conversa consigo mesmo")

    partner = db.query(models.User).filter(models.User.id == payload.recipient_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Destinatário não encontrado")

    # Check if conversation already exists
    existing = (
        db.query(models.Conversation)
        .join(models.conversation_participants)
        .filter(models.conversation_participants.c.user_id.in_([current_user.id, partner.id]))
        .group_by(models.Conversation.id)
        .having(models.Conversation.participants.any(id=current_user.id))
        .having(models.Conversation.participants.any(id=partner.id))
        .first()
    )

    if not existing:
        new_conv = models.Conversation()
        new_conv.participants.append(current_user)
        new_conv.participants.append(partner)
        db.add(new_conv)
        db.commit()
        db.refresh(new_conv)
        existing = new_conv

    last_msg = db.query(models.Message).filter(models.Message.conversation_id == existing.id).order_by(models.Message.timestamp.desc()).first()

    return {
        "conversation": {
            "id": existing.id,
            "created_at": existing.created_at,
            "updated_at": existing.updated_at,
            "partner": partner,
            "last_message": last_msg,
            "unread_count": 0
        }
    }

@router.get("/conversations/{conv_id}/messages", response_model=dict)
def get_messages(
    conv_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    if not conv or not any(p.id == current_user.id for p in conv.participants):
        raise HTTPException(status_code=403, detail="Acesso negado a esta conversa")

    messages = db.query(models.Message).filter(models.Message.conversation_id == conv_id).order_by(models.Message.timestamp.asc()).all()

    # Mark as read
    db.query(models.Message).filter(
        models.Message.conversation_id == conv_id,
        models.Message.recipient_id == current_user.id,
        models.Message.status != "read"
    ).update({"status": "read"})
    db.commit()

    return {"messages": messages}

@router.post("/conversations/{conv_id}/messages", response_model=dict, status_code=status.HTTP_201_CREATED)
async def send_message(
    conv_id: str,
    payload: schemas.MessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    if not conv or not any(p.id == current_user.id for p in conv.participants):
        raise HTTPException(status_code=403, detail="Acesso negado a esta conversa")

    partner = next((u for u in conv.participants if u.id != current_user.id), current_user)

    new_msg = models.Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        recipient_id=partner.id,
        content=payload.content,
        attachment_url=payload.attachment_url,
        attachment_name=payload.attachment_name,
        attachment_type=payload.attachment_type,
        status="sent"
    )

    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    # Real-time WebSocket delivery
    await manager.send_personal_message("new_message", {"message": {
        "id": new_msg.id,
        "conversation_id": new_msg.conversation_id,
        "sender_id": new_msg.sender_id,
        "recipient_id": new_msg.recipient_id,
        "content": new_msg.content,
        "attachment_url": new_msg.attachment_url,
        "attachment_name": new_msg.attachment_name,
        "timestamp": new_msg.timestamp.isoformat(),
        "status": new_msg.status
    }, "conversationId": conv.id}, partner.id)

    return {"message": new_msg}
