from tests.conftest import make_user, make_workspace, login

class TestSocketConnection:
    def test_connect(self, socket_client):
        assert socket_client.is_connected()

    def test_connect_emits_connected_event(self, socket_client):
        received = socket_client.get_received()
        events   = [e["name"] for e in received]
        assert "connected" in events

    def test_disconnect(self, socket_client):
        socket_client.disconnect()
        assert not socket_client.is_connected()

class TestWorkspaceRooms:
    def test_join_workspace_emits_room_joined(self, socket_client, db):
        alice = make_user(db)
        ws    = make_workspace(db, alice)
        socket_client.emit("join_workspace", {
            "workspace_id": ws.id,
            "user": {"id": alice.id, "username": alice.username},
        })
        received = socket_client.get_received()
        events   = [e["name"] for e in received]
        assert "room_joined" in events

    def test_join_workspace_emits_presence_updated(self, socket_client, db):
        alice = make_user(db)
        ws    = make_workspace(db, alice)
        socket_client.emit("join_workspace", {
            "workspace_id": ws.id,
            "user": {"id": alice.id, "username": alice.username},
        })
        received = socket_client.get_received()
        presence = next(e for e in received if e["name"] == "presence_updated")
        users    = presence["args"][0]["users"]
        assert any(u["username"] == "alice" for u in users)

    def test_leave_workspace_emits_room_left(self, socket_client, db):
        alice = make_user(db)
        ws    = make_workspace(db, alice)
        socket_client.emit("join_workspace", {
            "workspace_id": ws.id,
            "user": {"id": alice.id, "username": alice.username},
        })
        socket_client.get_received()
        socket_client.emit("leave_workspace", {"workspace_id": ws.id})
        received = socket_client.get_received()
        events   = [e["name"] for e in received]
        assert "room_left" in events
    
    def test_leave_removes_from_presence(self, socket_client, db):
        alice = make_user(db)
        ws    = make_workspace(db, alice)
        socket_client.emit("join_workspace", {
            "workspace_id": ws.id,
            "user": {"id": alice.id, "username": alice.username},
        })
        socket_client.get_received()
        socket_client.emit("leave_workspace", {"workspace_id": ws.id})
        received = socket_client.get_received()
        presence = next((e for e in received if e["name"] == "presence_updated"))
        if presence:
            users = presence["args"][0]["users"]
            assert not any(u(["username"] == "alice" for u in users))

class TestTaskBroadcasts:
    def test_task_created_broadcast(self, client, socket_client, db):
        alice = make_user(db)
        ws    = make_workspace(db, alice)
        login(client)
        socket_client.emit("join_workspace", {
            "workspace_id": ws.id,
            "user": {"id": alice.id, "username": alice.username},
        })
        socket_client.get_received()

        client.post(f"/api/workspaces/{ws.id}/tasks/", json={"title": "New task"})

        received = socket_client.get_received()
        events   = [e["name"] for e in received]
        assert "task_created" in events
        assert "activity"     in events

        task_event = next(e for e in received if e["name"] == "task_created")
        assert task_event["args"][0]["task"]["title"] == "New task"

    def test_task_updated_broadcast(self, client, socket_client, db):
        alice   = make_user(db)
        ws      = make_workspace(db, alice)
        login(client)
        task_id = client.post(f"/api/workspaces/{ws.id}/tasks/", json={"title": "A task"}).get_json()["task"]["id"]

        socket_client.emit("join_workspace", {
            "workspace_id": ws.id,
            "user": {"id": alice.id, "username": alice.username},
        })
        socket_client.get_received()

        client.patch(f"/api/workspaces/{ws.id}/tasks/{task_id}", json={"status": "done"})

        received = socket_client.get_received()
        events   = [e["name"] for e in received]
        assert "task_updated" in events

        update_event = next(e for e in received if e["name"] == "task_updated")
        assert update_event["args"][0]["task"]["status"] == "done"

    def test_task_deleted_broadcast(self, client, socket_client, db):
        alice   = make_user(db)
        ws      = make_workspace(db, alice)
        login(client)
        task_id = client.post(f"/api/workspaces/{ws.id}/tasks/", json={"title": "Doomed"}).get_json()["task"]["id"]

        socket_client.emit("join_workspace", {
            "workspace_id": ws.id,
            "user": {"id": alice.id, "username": alice.username},
        })
        socket_client.get_received()
        
        client.delete(f"/api/workspaces/{ws.id}/tasks/{task_id}")

        received = socket_client.get_received()
        events   = [e["name"] for e in received]
        assert "task_deleted" in events

        delete_event = next(e for e in received if e["name"] == "task_deleted")
        assert delete_event["args"][0]["task_id"] == task_id