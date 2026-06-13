from flask import request
from flask_socketio import emit, join_room, leave_room


def register_events(socketio):

    @socketio.on("connect")
    def on_connect():
        print(f"[WS] User connected — sid: {request.sid}")
        emit("connected", {"message": "Connection established."})

    @socketio.on("disconnect")
    def on_disconnect():
        print(f"[WS] User disconnected — sid: {request.sid}")

    @socketio.on("join_workspace")
    def on_join(data):
        workspace_id = data.get("workspace_id")
        join_room(workspace_id)
        print(f"[WS] {request.sid} joined room: {workspace_id}")
        emit("room_joined", {"workspace_id": workspace_id})

    @socketio.on("leave_workspace")
    def on_leave(data):
        workspace_id = data.get("workspace_id")
        leave_room(workspace_id)
        print(f"[WS] {request.sid} left room: {workspace_id}")
        emit("room_left", {"workspace_id": workspace_id})

    # store reference on the function so routes can access it
    register_events.socketio = socketio


def broadcast_task_created(workspace_id, task):
    register_events.socketio.emit(
        "task_created",
        {"task": task.to_dict()},
        room=workspace_id,
    )
    print(f"[WS] task_created broadcast to room: {workspace_id}")

def broadcast_task_updated(workspace_id, task):
    register_events.socketio.emit(
        "task_updated",
        {"task": task.to_dict()},
        room=workspace_id,
    )
    print(f"[WS] task_updated broadcast room: {workspace_id}")

def broadcast_task_deleted(workspace_id, task_id):
    register_events.socketio.emit(
        "task_deleted",
        {"task_id": task_id},
        room=workspace_id,
    )
    print(f"[WS] task_deleted broadcast to room: {workspace_id}")