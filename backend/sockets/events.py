from flask import request
from flask_socketio import emit
from app import socketio

@socketio.on("connect")
def on_connect():
    print(f"[WS] User connected - sid: {request.sid}")
    emit("connected", {"message": "Connection established."})

@socketio.on("disconnect")
def on_disconnect():
    print(f"[WS] User disconnected - sid: {request.sid}")