from models import db, Task, TaskStatus, Membership

def _require_membership(user_id: str, workspace_id: str) -> None:
    if not Membership.query.filter_by(
        user_id=user_id, workspace_id=workspace_id
    ).first():
        raise PermissionError("Access denied.")
    
def create_task(title: str, workspace_id: str, user_id: str) -> Task:
    _require_membership(user_id, workspace_id)

    task = Task(title=title, workspace_id=workspace_id, status=TaskStatus.TODO)
    db.session.add(task)
    db.session.commit()
    return task

def get_workspace_tasks(workspace_id: str, user_id: str) -> list[Task]:
    _require_membership(user_id, workspace_id)

    return Task.query.filter_by(workspace_id=workspace_id).all()

def update_task(task_id: str, user_id: str, **fields) -> Task:
    task = Task.query.get(task_id)
    if not task:
        raise LookupError("Task not found.")
    
    _require_membership(user_id, task.workspace_id)

    if "title" in fields:
        title = (fields["title"] or "").strip()
        if not title:
            raise ValueError("title cannot be empty.")
        task.title = title

    if "status" in fields:
        try:
            task.status = TaskStatus(fields["status"])
        except ValueError:
            valid = [s.value for s in TaskStatus]
            raise ValueError(f"Invalid status. Must be one of: {valid}")
        
        db.session.commit()
        return task
    
def delete_task(task_id: str, user_id: str) -> None:
    task = Task.query.get(task_id)
    if not task:
        raise LookupError("Task not found.")
    
    _require_membership(user_id, task.workspace_id)

    db.session.delete(task)
    db.session.commit()