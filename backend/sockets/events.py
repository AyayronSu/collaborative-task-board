# backend/sockets/events.py
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

        for workspace_id in list(presence.keys()):
            if sid in presence[workspace_id]:
                user = presence[workspace_id].pop(sid)
                socketio.emit(
                    "presence_updated",
                    {"users": list(presence[workspace_id].values())},
                    room=workspace_id,
                )
                if not presence[workspace_id]:
                    del presence[workspace_id]

    @socketio.on("join_user_room")
    def on_join_user_room(data):
        user_id = data.get("user_id")
        join_room(f"user_{user_id}")
        print(f"[WS] {request.sid} joined personal room: user_{user_id}")

    @socketio.on("join_workspace")
    def on_join(data):
        workspace_id = data.get("workspace_id")
        user         = data.get("user")
        sid          = request.sid

        join_room(workspace_id)

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
            if not presence[workspace_id]:
                del presence[workspace_id]

        emit("room_left", {"workspace_id": workspace_id})

    register_events.socketio = socketio


def _emit(workspace_id, event, payload):
    register_events.socketio.emit(event, payload, room=workspace_id)


def broadcast_task_created(workspace_id, task, actor: str):
    _emit(workspace_id, "task_created", {"task": task.to_dict()})
    _emit(workspace_id, "activity", {
        "message": f"{actor} created \"{task.title}\"",
    })


def broadcast_task_updated(workspace_id, task, actor: str, fields: dict):
    _emit(workspace_id, "task_updated", {"task": task.to_dict()})

    if "status" in fields:
        from models import TaskStatus
        labels = {
            TaskStatus.TODO.value:        "To do",
            TaskStatus.IN_PROGRESS.value: "In progress",
            TaskStatus.DONE.value:        "Done",
        }
        label = labels.get(fields["status"], fields["status"])
        message = f"{actor} moved \"{task.title}\" to {label}"
    else:
        message = f"{actor} renamed a task to \"{task.title}\""

    _emit(workspace_id, "activity", {"message": message})


def broadcast_task_deleted(workspace_id, task_id, task_title: str, actor: str):
    _emit(workspace_id, "task_deleted", {"task_id": task_id})
    _emit(workspace_id, "activity", {
        "message": f"{actor} deleted \"{task_title}\"",
    })


def broadcast_workspace_added(user_id: str, workspace):
    register_events.socketio.emit(
        "workspace_added",
        {"workspace": workspace.to_dict()},
        room=f"user_{user_id}",
    )
    print(f"[WS] workspace_added sent to user room: user_{user_id}")