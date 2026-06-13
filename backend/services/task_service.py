from models import db, Task, TaskStatus


def create_task(title: str, workspace_id: str) -> Task:
    task = Task(title=title, workspace_id=workspace_id, status=TaskStatus.TODO)
    db.session.add(task)
    db.session.commit()
    return task


def get_workspace_tasks(workspace_id: str) -> list[Task]:
    return Task.query.filter_by(workspace_id=workspace_id).all()


def update_task(task_id: str, **fields) -> Task:
    task = Task.query.get(task_id)
    if not task:
        raise LookupError("Task not found.")

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


def delete_task(task_id: str) -> None:
    task = Task.query.get(task_id)
    if not task:
        raise LookupError("Task not found.")

    db.session.delete(task)
    db.session.commit()

def get_task_by_id(task_id: str) -> Task:
    task = Task.query.get(task_id)
    if not task:
        raise LookupError("Task not found.")
    return task