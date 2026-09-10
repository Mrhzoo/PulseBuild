from app.main import app


def test_documents_list_route_registered():
    paths = set(app.openapi()["paths"])
    assert "/api/documents" in paths
    assert "/api/projects" in paths
