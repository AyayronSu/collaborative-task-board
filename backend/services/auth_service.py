from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

def create_user(username: str, email: str, password: str) -> User:
    if User.query.filter_by(email=email).first():
        raise ValueError("Email already registered.")
    if User.query.filter_by(username=username).first():
        raise ValueError("Username already taken.")
    
    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
    )
    db.session.add(user)
    db.session.commit()
    return user

def authenticate_user(email: str, password: str) -> User:
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        raise ValueError("Invalid email or password.")
    return user