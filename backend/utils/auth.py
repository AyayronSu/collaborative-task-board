from functools import wraps
from flask import jsonify, session
from models import User, Membership


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "Not authenticated."}), 401

        user = User.query.get(user_id)
        if not user:
            session.clear()
            return jsonify({"error": "User no longer exists."}), 401

        return f(*args, user_id=user_id, **kwargs)
    return decorated


def workspace_member_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        workspace_id = kwargs.get("workspace_id")
        user_id = kwargs.get("user_id")

        membership = Membership.query.filter_by(
            user_id=user_id,
            workspace_id=workspace_id,
        ).first()

        if not membership:
            return jsonify({"error": "Access denied."}), 403

        return f(*args, **kwargs)
    return decorated