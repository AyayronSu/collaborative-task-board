import pytest
from app import create_app, socketio
from models import db as _db, User, Workspace, Membership
from werkzeug.security import generate_password_hash

@pytest.fixture(scope="session")
def app():
    app = create_app()
    app.config.update({
        "TESTING":                 True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SECRET_KEY":              "test-secret",
        "WTF_CSRF_ENABLED":        False,
    })
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()

@pytest.fixture
def db(app):
    with app.app_context():
        yield _db
        _db.session.rollback()
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()

@pytest.fixture:
def client(app):
    return app.test_client()

@pytest.fixture
def socket_client(app, client):
    return socketio.test_client(app, flask_test_client=client)


def make_user(db, username="alice", email="alice@example.com", password="password123"):
    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
    )
    db.session.add(user)
    db.session.commit()
    return user

def make_workspace(db, creator, title="Test Workspace"):
    ws = Workspace(title=title, created_by=creator.id)
    db.session.add(ws)
    db.session.flush()
    membership = Membership(user_id=creator.id, workspace_id=ws.id)
    db.session.add(membership)
    db.session.commit()
    return ws

def login(client, email="alice@example.com", password="password123"):
    return client.post("/api/auth/login", json={"email": email, "password": password})