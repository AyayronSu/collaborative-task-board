from flask import request
from flask_socketio import emit, join_room, leave_room


def register_events(socketio):

    @socketio.on("connect")
    def on_connect():
        sid = request.sid
        print(f"[WS] User connected — sid: {sid}")
        emit("connected", {"message": "Connection established."})

    @socketio.on("disconnect")
    def on_disconnect():
        sid = request.sid
        print(f"[WS] User disconnected — sid: {sid}")

    @socketio.on("join_workspace")
    def on_join(data):
        workspace_id = data.get("workspace_id")
        sid = request.sid
        join_room(workspace_id)
        print(f"[WS] {sid} joined room: {workspace_id}")
        emit("room_joined", {"workspace_id": workspace_id})

    @socketio.on("leave_workspace")
    def on_leave(data):
        workspace_id = data.get("workspace_id")
        sid = request.sid
        leave_room(workspace_id)
        print(f"[WS] {sid} left room: {workspace_id}")
        emit("room_left", {"workspace_id": workspace_id})