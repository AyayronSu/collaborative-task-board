import uuid
from .base import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    username = db.Column(db.String(80), nullable=False, unique=True)
    email    = db.Column(db.String(255), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)

    memberships       = db.relationship("Membership", back_populates="user", cascade="all, delete-orphan")
    created_workspaces = db.relationship("Workspace", back_populates="creator")

    def to_dict(self):
        return {"id": self.id, "username": self.username, "email": self.email}
    
    def __repr__(self):
        return f"<User {self.username}>"