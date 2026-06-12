from flask import Blueprint, request, jsonify, session
from services.task_service import (
    create_task,
    get_workspace_tasks,
    update_task,
    delete_task,
)

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/workspaces/<workspace_id>/tasks")

def _require_auth():
    user_id = session.get("user_id")
    if not user_id:
        return None, (jsonify({"error": "Not authenticated."})), 401
    return user_id, None

@tasks_bp.post("/")
def create(workspace_id):
    user_id, err = _require_auth()
    if err:
        return err
    
    title = (request.get_json().get("title") or "").strip()
    if not title:
        return jsonify({"error": "title` is required."}), 400
    
    try:
        task = create_task(title, workspace_id, user_id)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    
    return jsonify({"task": task.to_dict()}), 201

@tasks_bp.get("/")
def list_all(workspace_id):
    user_id, err = _require_auth()
    if err:
        return err
    
    try:
        tasks = get_workspace_tasks(workspace_id, user_id)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    
    return jsonify({"tasks": [t.to_dict() for t in tasks]}), 200

@tasks_bp.patch("/<task_id>")
def update(workspace_id, task_id):
    user_id, err = _require_auth()
    if err:
        return err
    
    data = request.get_json()
    fields = {k: data[k] for k in ("title", "status") if k in data}

    if not fields:
        return jsonify({"error": "Provide at least one of: title, status."}), 400
    
    try:
        task = update_task(task_id, user_id, **fields)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 422
    
    return jsonify({"task": task.to_dict()}), 200

@tasks_bp.delete("/<task_id>")
def delete(workspace_id, task_id):
    user_id, err = _require_auth()
    if err:
        return err
    
    try:
        delete_task(task_id, user_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    
    return jsonify({"message": "Task deleted."}), 200