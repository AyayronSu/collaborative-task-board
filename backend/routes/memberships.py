from flask import Blueprint, request, jsonify
from utils.auth import login_required, workspace_member_required
from services.membership_service import (
    get_workspace_members,
    add_member_by_email,
    remove_member,
)

memberships_bp = Blueprint(
    "memberships", __name__,
    url_prefix="/api/workspaces/<workspace_id>/members"
)

@memberships_bp.get("/")
@login_required
@workspace_member_required
def list_members(workspace_id, user_id):
    members = get_workspace_members(workspace_id)
    return jsonify({"members": [m.to_dict() for m in members]}), 200

@memberships_bp.post("/")
@login_required
@workspace_member_required
def add_member(workspace_id, user_id):
    email = (request.get_json().get("email") or "").strip()
    if not email:
        return jsonify({"error": "email is required."}), 400
    
    try:
        user = add_member_by_email(workspace_id, email, user_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 409
    
    return jsonify({"member": user.to_dict()}), 201

@memberships_bp.delete("/<target_user_id>")
@login_required
@workspace_member_required
def remove_member_route(workspace_id, target_user_id, user_id):
    try:
        remove_member(workspace_id, target_user_id, user_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    
    return jsonify({"message": "Member removed."}), 200