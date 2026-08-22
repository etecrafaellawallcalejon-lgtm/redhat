from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirmPassword: Optional[str] = None

class UserLogin(BaseModel):
    identifier: str  # Email OR Username
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    avatar: Optional[str] = None
    status: Optional[str] = None
    custom_status: Optional[str] = None
    bio: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    avatar: str
    status: str
    custom_status: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    last_seen: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    message: str
    token: str
    user: UserResponse

# Message Schemas
class MessageCreate(BaseModel):
    recipient_id: str
    conversation_id: Optional[str] = None
    content: str
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_type: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    recipient_id: str
    content: str
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_type: Optional[str] = None
    timestamp: datetime
    status: str

    class Config:
        from_attributes = True

# Conversation Schemas
class ConversationCreate(BaseModel):
    recipient_id: str

class ConversationResponse(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    partner: UserResponse
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0

    class Config:
        from_attributes = True
