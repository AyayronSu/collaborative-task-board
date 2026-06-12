from models import db, Workspace, Membership

def create_workspace(title: str, user_id: str) -> Workspace:
    workspace = Workspace(title=title, created_by=user_id)
    db.session.add(workspace)
    db.session.flush()

    membership = Membership(user_id=user_id, workspace_id=workspace.id)
    db.session.add(membership)
    db.session.commit()
    return workspace

def get_user_workspaces(user_id: str) -> list[Workspace]:
    return (
        Workspace.query
        .join(Membership, Membership.workspace_id == Workspace.id)
        .filter(Membership.user_id == user_id)
        .all()
    )

def get_workspace(workspace_id: str, user_id: str) -> Workspace:
    workspace = Workspace.query.get(workspace_id)
    if not workspace:
        raise LookupError("Workspace not found.")
    return workspace

def rename_workspace(workspace_id: str, new_title: str, user_id: str) -> Workspace:
    workspace = Workspace.query.get(workspace_id)
    if not workspace:
        raise LookupError("Workspace not found.")
    if workspace.created_by != user_id:
        raise PermissionError("Only the creator can rename this workspace.")
    
    workspace.title = new_title
    db.session.commit()
    return workspace

def delete_workspace(workspace_id: str, user_id: str) -> None:
    workspace = Workspace.query.get(workspace_id)
    if not workspace:
        raise LookupError("Workspace not found.")
    if workspace.created_by != user_id:
        raise PermissionError("Only the creator can delete this workspace.")
    
    db.session.delete(workspace)
    db.session.commit()