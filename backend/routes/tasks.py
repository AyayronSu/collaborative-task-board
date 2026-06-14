# backend/routes/tasks.py
from flask import Blueprint, request, jsonify
from utils.auth import login_required, workspace_member_required
from services.task_service import (
    create_task,
    get_workspace_tasks,
    update_task,
    delete_task,
    get_task_by_id,
)
from services.auth_service import get_user_by_id
from sockets.events import (
    broadcast_task_created,
    broadcast_task_updated,
    broadcast_task_deleted,
)

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/workspaces/<workspace_id>/tasks")


@tasks_bp.post("/")
@login_required
@workspace_member_required
def create(workspace_id, user_id):
    title = (request.get_json().get("title") or "").strip()
    if not title:
        return jsonify({"error": "title is required."}), 400

    task = create_task(title, workspace_id)
    user = get_user_by_id(user_id)
    broadcast_task_created(workspace_id, task, actor=user.username)
    return jsonify({"task": task.to_dict()}), 201


@tasks_bp.get("/")
@login_required
@workspace_member_required
def list_all(workspace_id, user_id):
    tasks = get_workspace_tasks(workspace_id)
    return jsonify({"tasks": [t.to_dict() for t in tasks]}), 200


@tasks_bp.patch("/<task_id>")
@login_required
@workspace_member_required
def update(workspace_id, task_id, user_id):
    data = request.get_json()
    fields = {k: data[k] for k in ("title", "status") if k in data}

    if not fields:
        return jsonify({"error": "Provide at least one of: title, status."}), 400

    try:
        task = update_task(task_id, **fields)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    user = get_user_by_id(user_id)
    broadcast_task_updated(workspace_id, task, actor=user.username, fields=fields)
    return jsonify({"task": task.to_dict()}), 200


@tasks_bp.delete("/<task_id>")
@login_required
@workspace_member_required
def delete(workspace_id, task_id, user_id):
    try:
        task = get_task_by_id(task_id)
        delete_task(task_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404

    user = get_user_by_id(user_id)
    broadcast_task_deleted(workspace_id, task_id, task_title=task.title, actor=user.username)
    return jsonify({"message": "Task deleted."}), 200