import uuid
from .base import db

class Workspace(db.Model):
    __tablename__ = "workspaces"

    id         = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title      = db.Column(db.String(255), nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)

    creator     = db.relationship("User",      back_populates="created_workspaces")
    memberships = db.relationship("Membership", back_populates="workspace", cascade="all, delete-orphan")
    tasks       = db.relationship("Task",       back_populates="workspace", cascade="all, delete-orphan")

    def to_dict(self):
        return {"id": self.id, "title": self.title, "created_by": self.created_by}
    
    def __repr__(self):
        return f"<Workspace {self.title}>"