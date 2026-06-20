from tests.conftest import make_user, make_workspace, login

class TestCreateWorkspace:
    def test_create_success(self, client, db):
        make_user(db)
        login(client)
        res = client.post("/api/workspaces/", json={"title": "My Board"})
        assert res.status_code == 201
        assert res.get_json()["workspace"]["title"] == "My Board"

    def test_create_unauthenticated(self, client, db):
        res = client.post("/api/workspaces/", json={"title": "My Board"})
        assert res.status_code == 401

    def test_create_missing_title(self, client, db):
        make_user(db)
        login(client)
        res = client.post("/api/workspaces/", json={})
        assert res.status_code == 400

    def test_create_adds_creator_as_member(self, client, db):
        make_user(db)
        login(client)
        res = client.post("/api/workspaces/", json={"title": "My Board"})
        ws_id = res.get_json()["workspace"]["id"]
        members = client.get(f"/api/workspaces/{ws_id}/members/").get_json()["members"]
        assert any(m["username"] == "alice" for m in members)

class TestListWorkspaces:
    def test_lists_own_workspaces(self, client, db):
        alice = make_user(db)
        make_workspace(db, alice, "Alice WS")
        login(client)
        res = client.get("/api/workspaces/")
        assert res.status_code == 200
        titles = [w["title"] for w in res.get_json()["workspaces"]]
        assert "Alice WS" in titles
    
    def test_does_not_list_others_workspaces(self, client, db):
        bob = make_user(db, "bob", "bob@example.com")
        make_workspace(db, bob, "Bob's Private WS")
        make_user(db, "alice", "alice@example.com")
        login(client)
        res = client.get("/api/workspaces/")
        titles = [w["title"] for w in res.get_json()["workspaces"]]
        assert "Bob's Private WS" not in titles

class TestWorkspacePermissions:
    def test_non_member_cannot_view(self, client, db):
        bob = make_user(db, "bob", "bob@example.com")
        ws = make_workspace(db, bob)
        make_user(db)
        login(client)
        res = client.get(f"/api/workspaces/{ws.id}")
        assert res.status_code == 403

    def test_non_creator_cannot_rename(self, client, db):
        bob   = make_user(db, "bob", "bob@example.com")
        ws    = make_workspace(db, bob)
        alice = make_user(db)
        from models import Membership
        db.session.add(Membership(user_id=alice.id, workspace_id=ws.id))
        db.session.commit()
        login(client)
        res = client.patch(f"/api/workspaces/{ws.id}", json={"title": "Hacked"})
        assert res.status_code == 403

    def test_non_creator_cannot_delete(self, client, db):
        bob   = make_user(db, "bob", "bob@example.com")
        ws    = make_workspace(db, bob)
        alice = make_user(db)
        from models import Membership
        db.session.add(Membership(user_id=alice.id, workspace_id=ws.id))
        db.session.commit()
        login(client)
        res = client.delete(f"/api/workspaces/{ws.id}")
        assert res.status_code == 403

    def test_creator_can_rename(self, client, db):
        make_user(db)
        login(client)
        ws_id = client.post("/api/workspaces/", json={"title": "Old"}).get_json()["workspace"]["id"]
        res = client.patch(f"/api/workspaces/{ws.id}", json={"title": "New"})
        assert res.status_code == 200
        assert res.get_json()["workspace"]["title"] == "New"

    def test_creator_can_delete(self, client, db):
        make_user(db)
        login(client)
        ws_id = client.post("/api/workspaces/", json={"title": "Temp"}).get_json()["workspace"]["id"]
        res = client.delete(f"/api/workspaces/{ws_id}")
        assert res.status_code == 200
        assert client.get(f"/api/workspaces/{ws_id}").status_code == 404
