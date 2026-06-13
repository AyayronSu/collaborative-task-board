from flask import request
from flask_socketio import emit, join_room, leave_room

presence = {}

def register_events(socketio):

    @socketio.on("connect")
    def on_connect():
        print(f"[WS] User connected — sid: {request.sid}")
        emit("connected", {"message": "Connection established."})

    @socketio.on("disconnect")
    def on_disconnect():
        sid = request.sid
        print(f"[WS] User disconnected — sid: {sid}")

        for workspace_id, users in list(presence.items()):
            if sid in users:
                user = users.pop(sid)
                socketio.emit(
                    "presence_updated",
                    {"users": list(users.values())},
                    room=workspace_id,
                )
                print(f"[WS] {user['username']} left presence in room: {workspace_id}")
                if not users:
                    del presence[workspace_id]
                break

    @socketio.on("join_workspace")
    def on_join(data):
        workspace_id = data.get("workspace_id")
        user         = data.get("user")
        sid          = request.sid

        join_room(workspace_id)
        print(f"[WS] {request.sid} joined room: {workspace_id}")

        if workspace_id not in presence:
            presence[workspace_id] = {}
        presence[workspace_id][sid] = user

        socketio.emit(
            "presence_updated",
            {"users": list(presence[workspace_id].values())},
            room=workspace_id,
        )
        emit("room_joined", {"workspace_id": workspace_id})

    @socketio.on("leave_workspace")
    def on_leave(data):
        workspace_id = data.get("workspace_id")
        sid          = request.sid

        leave_room(workspace_id)

        if workspace_id in presence and sid in presence[workspace_id]:
            user = presence[workspace_id].pop(sid)
            socketio.emit(
                "presence_updated",
                {"users": list(presence[workspace_id].values())},
                room=workspace_id,
            )
            print(f"[WS] {request.sid} left room: {workspace_id}")
            if not presence[workspace_id]:
                del presence[workspace_id
                             ]
        emit("room_left", {"workspace_id": workspace_id})

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