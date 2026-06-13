from models import db, User, Workspace, Membership

def get_workspace_members(workspace_id: str) -> list[User]:
    return (
        User.query
         .join(Membership, Membership.user_id == User.id)
         .filter(Membership.workspace_id == workspace_id)
         .all()
    )

def add_member_by_email(workspace_id: str, email: str, requesting_user_id: str) -> User:
    workspace = Workspace.query.get(workspace_id)
    if not workspace:
        raise LookupError("Workspace not found.")
    if workspace.created_by != requesting_user_id:
        raise PermissionError("Only the workspace creator can add members.")
    
    user = User.query.filter_by(email=email.lower().strip()).first()
    if not user:
        raise LookupError("No user found with that email.")
    
    already_member = Membership.query.filter_by(
        user_id=user.id,
        workspace_id=workspace_id,
    ).first()
    if already_member:
        raise ValueError("User is already a member of this workspace.")
    
    membership = Membership(user_id=user.id, workspace_id=workspace_id)
    db.session.add(membership)
    db.session.commit()
    return user

def remove_member(workspace_id: str, target_user_id: str, requesting_user_id: str) -> None:
    workspace = Workspace.query.get(workspace_id)
    if not workspace:
        raise LookupError("Workspace not found.")
    
    if requesting_user_id != target_user_id and workspace.created_by != requesting_user_id:
        raise PermissionError("Only the workspace creator can remove other members.")
    
    if target_user_id == workspace.created_by:
        raise ValueError("The workspace creator cannot be removed.")
    
    membership = Membership.query.filter_by(
        user_id=target_user_id,
        workspace_id=workspace_id,
    ).first()
    if not membership:
        raise LookupError("User is not a member of this workspace.")
    
    db.session.delete(membership)
    db.session.commit()