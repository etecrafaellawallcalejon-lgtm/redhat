import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
import models
from auth import decode_token
from websocket import manager
from routes import auth_routes, user_routes, chat_routes

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RedChat API",
    description="Backend completo para o aplicativo de mensagens instantâneas RedChat",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_routes.router, prefix="/api")
app.include_router(user_routes.router, prefix="/api")
app.include_router(chat_routes.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "RedChat API Backend está ativo e operante 🔴", "docs": "/docs"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "RedChat FastAPI", "database": "SQLite"}

# WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    user_id = None
    if token:
        payload = decode_token(token)
        if payload:
            user_id = payload.get("id")

    if not user_id:
        await websocket.close(code=1008)
        return

    await manager.connect(user_id, websocket)
    
    # Broadcast user online
    await manager.broadcast("user_status_changed", {"userId": user_id, "status": "online"})

    try:
        while True:
            raw_data = await websocket.receive_text()
            data_json = json.loads(raw_data)
            action = data_json.get("action")
            data = data_json.get("data", {})

            if action == "typing":
                recipient_id = data.get("recipient_id")
                if recipient_id:
                    await manager.send_personal_message("typing_status", {
                        "userId": user_id,
                        "conversation_id": data.get("conversation_id"),
                        "is_typing": data.get("is_typing", True)
                    }, recipient_id)

            elif action == "update_status":
                new_status = data.get("status")
                custom_status = data.get("custom_status")
                if new_status:
                    db = SessionLocal()
                    try:
                        u = db.query(models.User).filter(models.User.id == user_id).first()
                        if u:
                            u.status = new_status
                            if custom_status is not None:
                                u.custom_status = custom_status
                            db.commit()
                    finally:
                        db.close()
                    await manager.broadcast("user_status_changed", {
                        "userId": user_id,
                        "status": new_status,
                        "custom_status": custom_status
                    })

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        if user_id not in manager.active_connections:
            await manager.broadcast("user_status_changed", {"userId": user_id, "status": "offline"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
