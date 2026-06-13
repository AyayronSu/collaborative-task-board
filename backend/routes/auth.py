from flask import Blueprint, request, jsonify, session
from services.auth_service import create_user, authenticate_user

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.post("/signup")
def signup():
    data = request.get_json()
    username = (data.get("username") or "").strip()
    email    = (data.get("email")    or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return jsonify({"error": "username, email, and password are required."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400
    
    try:
        user = create_user(username, email, password)
    except ValueError as e:
        return jsonify({"error": str(e)}), 409
    
    session["user_id"] = user.id
    return jsonify({"user": user.to_dict()}), 201

@auth_bp.post("/login")
def login():
    data  = request.get_json()
    email    = (data.get("email")   or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "email and password are required."}), 400
    
    try:
        user = authenticate_user(email, password)
    except ValueError as e:
        return jsonify({"error": str(e)}), 401
    
    session["user_id"] = user.id
    return jsonify({"user": user.to_dict()}), 200

@auth_bp.post("/logout")
def logout():
    session.clear()
    return jsonify({"message": "Logged out."}), 200

@auth_bp.get("/me")
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated."}), 401
    
    from models import User
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    
    return jsonify({"user": user.to_dict()}), 200