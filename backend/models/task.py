import uuid
import enum
from .base import db

class TaskStatus(enum.Enum):
    TODO        = "todo"
    IN_PROGRESS = "in_progress"
    DONE        = "done"

class Task(db.Model):
    __tablename__ = "tasks"

    id          = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title       = db.Column(db.String(255), nullable=False)
    status      = db.Column(db.Enum(TaskStatus), nullable=False, default=TaskStatus.TODO)
    workspace_id = db.Column(db.String(36), db.ForeignKey("workspaces.id"), nullable=False)

    workspace = db.relationship("Workspace", back_populates="tasks")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "status": self.status.value,
            "workspace_id": self.workspace_id,
        }
    
    def __repr__(self):
        return f"<Task {self.title} [{self.status.value}]"