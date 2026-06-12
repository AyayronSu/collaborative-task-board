from .base import db

class Membership(db.Model):
    __tablename__ = "memberships"

    user_id      = db.Column(db.String(36), db.ForeignKey("users.id"),     primary_key=True)
    workspace_id = db.Column(db.String(36), db.ForeignKey("workspaces.id"), primary_key=True)

    user       = db.relationship("User",    back_populates="memberships")
    workspace  = db.relationship("Workspace", back_populates="memberships")

    def to_dict(self):
        return {"user_id": self.user_id, "workspace_id": self.workspace_id}
    
    def __repr__(self):
        return f"<Membership user={self.user_id} workspace={self.workspace_id}"