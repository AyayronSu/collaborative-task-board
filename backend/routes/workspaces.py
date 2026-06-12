from flask import Blueprint, request, jsonify, session
from utils.auth import login_required, workspace_member_required
from services.workspace_service import (
    create_workspace,
    get_user_workspaces,
    get_workspace,
    rename_workspace,
    delete_workspace,
)

workspaces_bp = Blueprint("workspaces", __name__, url_prefix="/api/workspaces")


@workspaces_bp.post("/")
@login_required
def create():
    user_id, err = _require_auth()
    if err:
        return err
    
    title = (request.get_json().get("title") or "").strip()
    if not title:
        return jsonify({"error": "title is required."}), 400
    
    workspace = create_workspace(title, user_id)
    return jsonify({"workspace": workspace.to_dict()}), 201

@workspaces_bp.get("/")
@login_required
def list_all():
    user_id, err = _require_auth()
    if err:
        return err
    
    workspaces = get_user_workspaces(user_id)
    return jsonify({"workspaces": [w.to_dict() for w in workspaces]}), 200

@workspaces_bp.get("/<workspace_id>")
@login_required
@workspace_member_required
def get_one(workspace_id):
    user_id, err = _require_auth()
    if err:
        return err
    
    try:
        workspace = get_workspace(workspace_id, user_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    
    return jsonify({"workspace": workspace.to_dict()}), 200

@workspaces_bp.patch("/<workspace_id>")
@login_required
@workspace_member_required
def rename(workspace_id):
    user_id, err = _require_auth()
    if err:
        return err
    
    new_title = (request.get_json().get("title") or "").strip()
    if not new_title:
        return jsonify({"error": "title is required."}), 400
    
    try:
        workspace = rename_workspace(workspace_id, new_title, user_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    
    return jsonify({"workspace": workspace.to_dict()}), 200

@workspaces_bp.delete("/<workspace_id>")
@login_required
@workspace_member_required
def delete(workspace_id):
    user_id, err = _require_auth()
    if err:
        return err
    
    try:
        delete_workspace(workspace_id, user_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    
    return jsonify({"message": "Workspace deleted."}), 200