from tests.conftest import make_user, make_workspace, login

class TestTaskCRUD:
    def test_create_task(self, client, db):
        alice = make_user(db)
        ws    = make_workspace(db, alice)
        login(client)
        res = client.post(f"/api/workspaces/{ws.id}/tasks/", json={"title": "Write tests"})
        assert res.status_code == 201
        task = res.get_json()["task"]
        assert task["title"] == "Write tests"
        assert task["status"] == "todo"

    def test_create_task_missing_title(self, client, db):
        alice = make_user(db)
        ws    = make_workspace(db, alice)
        login(client)
        res = client.post(f"/api/workspaces/{ws.id}/tasks/", json={})
        assert res.status_code == 400

    def test_list_tasks(self, client, db):
        alice = make_user(db)
        ws    = make_workspace(db, alice)
        login(client)
        client.post(f"/api/workspaces/{ws.id}/tasks/", json={"title": "Task A"})
        client.post(f"/api/workspaces/{ws.id}/tasks/", json={"title": "Task B"})
        res = client.get(f"/api/workspaces/{ws.id}/tasks/")
        assert res.status_code == 200
        titles = [t["title"] for t res.get_json()["tasks"]]
        assert "Task A" in titles
        assert "Task B" in titles

    def test_update_task_title(self, client, db):
        alice = make_user(db)
        ws    = make_workspace(db, alice)
        login(client)
        task_id = client.post(f"/api/workspaces/{ws.id}/tasks/", json={"title": "Old"}).get_json()["task"]["id"]
        res = client.patch(f"/api/workspaces/{ws.id}/tasks/{task_id}", json={"title": "New"})
        assert res.status_code == 200
        assert res.get_json()["task"]["title"] == "New"

    def test_update_task_status(self, client, db):
        alice = make_user(db)
        ws    = make_workspace(db, alice)
        login(client)
        task_id = client.post(f"/api/workspaces/{ws.id}/tasks/", json={"title": "A task"}).get_json()["task"]["id"]
        res = client.patch(f"/api/workspaces/{ws.id}/tasks/{task_id}", json={"status": "in_progress"})
        assert res.status_code == 200
        assert res.get_json()["task"]["status"] == "in_progress"

    def test_update_invalid_status(self, client, db):
        alice = make_user(db)
        ws    = make_workspace(db, alice)
        login(client)
        task_id = client.post(f"/api/workspaces/{ws.id}/tasks/", json={"title": "A task"}).get_json()["task"]["id"]
        res = client.patch(f"/api/workspaces/{ws.id}/tasks/{task_id}", json={"status": "flying"})
        assert res.status_code == 422

    def test_delete_task(self, client, db):
        alice = make_user(db)
        ws    = make_workspace(db, alice)
        login(client)
        task_id = client.post(f"/api/workspaces/{ws.id}/tasks/", json={"title": "Doomed"}).get_json()["task"]["id"]
        res = client.delete(f"/api/workspaces/{ws.id}/tasks/{task_id}")
        assert res.status_code == 200
        tasks = client.get(f"/api/workspaces/{ws.id}/tasks/").get_json()["tasks"]
        assert not any(t["id"] == task_id for t in tasks)

    def test_non_member_cannot_create_task(self, client, db):
        bob = make_user(db, "bob", "bob@example.com")
        ws  = make_workspace(db, bob)
        make_user(db)
        login(client)
        res = client.post(f"/api/workspaces/{ws.id}/tasks/", json={"title": "Sneaky"})
        assert res.status_code == 403

    def test_non_member_cannot_list_tasks(self, client, db):
        bob = make_user(db, "bob", "bob@example.com")
        ws  = make_workspace(db, bob)
        make_user(db)
        login(client)
        res = client.get(f"/api/workspaces/{ws.id}/tasks/")
        assert res.status_code == 403