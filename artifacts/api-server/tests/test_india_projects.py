from fastapi.testclient import TestClient
from backend.main import app


client = TestClient(app)


def test_india_projects_library_is_seeded_and_filterable():
    response = client.get("/api/india-projects")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 30
    assert len(data["items"]) == 30
    assert len(data["filters"]["categories"]) >= 10

    semiconductor = client.get("/api/india-projects?category=Semiconductor")
    assert semiconductor.status_code == 200
    assert semiconductor.json()["total"] == 3
    assert all(item["category"] == "Semiconductor" for item in semiconductor.json()["items"])


def test_india_project_detail_and_missing_project():
    response = client.get("/api/india-projects/1")
    assert response.status_code == 200
    project = response.json()
    assert project["name"]
    assert project["official_source_url"].startswith("http")
    assert project["last_verified_at"]

    missing = client.get("/api/india-projects/999999")
    assert missing.status_code == 404