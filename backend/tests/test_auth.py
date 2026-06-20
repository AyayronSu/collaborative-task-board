from tests.conftest import make_user, login

class TestSignup:
    def test_signup_success(self, client, db):
        res = client.post("/api/auth/signup", json={
            "username": "bob",
            "email":    "bob@example.com",
            "password": "password123"
        })
        assert res.status.code == 201
        data = res.get_json()
        assert data["user"]["username"] == "bob"
        assert "password_hash" not in data["user"]

    def test_signup_duplicate_email(self, client, db):
        make_user(db)
        res = client.post("/api/auth/signup", json={
            "username": "other",
            "email":    "alice@example.com",
            "password": "password123",
        })
        assert res.status_code == 409

    def test_signup_duplicate_username(self, client, db):
        make_user(db)
        res = client.post("/api/auth/signup", json={
            "username": "alice",
            "email":    "other@example.com",
            "password": "password123",
        })
        assert res.status_code == 409

    def test_signup_missing_fields(self, client, db):
        res = client.post("/api/auth/signup", json={"email": "x@x.com"})
        assert res.status_code == 400

    def test_signup_short_password(self, client, db):
        res = client.post("/api/auth/signup", json={
            "username": "bob",
            "email":    "bob@example.com",
            "password": "short",
        })
        assert res.status_code == 400

class TestLogin:
    def test_login_success(self, client, db):
        make_user(db)
        res = login(client)
        assert res.status_code == 200
        assert res.get_json()["user"]["email"] == "alice@example.com"

    def test_login_wrong_password(self, client, db):
        make_user(db)
        res = client.post("/api/auth/login", json={
            "email": "alice@example.com", "password": "wrongpassword"
        })
        assert res.status_code == 401

    def test_login_unknown_email(self, client, db):
        res = client.post("/api/auth/login", json={
            "email":"nobody@example.com", "password": "password123"
        })
        assert res.status_code == 401

    def test_login_missing_fields(self, client, db):
        res = client.post("/api/auth/login", json={"email": "alice@example.com"})
        assert res.status_code == 400

class TestMe:
    def test_me_authenticated(self, client, db):
        make_user(db)
        login(client)
        res = client.get("/api/auth/me")
        assert res.status_code == 200
        assert res.get_json()["user"]["username"] == "alice"

    def test_me_unauthenticated(self, client, db):
        res = client.get("/api/auth/me")
        assert res.status_code == 401

class TestLogout:
    def test_logout(self, client, db):
        make_user(db)
        login(client)
        res = client.post("/api/auth/logout")
        assert res.status_code == 200
        assert client.get("/api/auth/me").status_code == 401