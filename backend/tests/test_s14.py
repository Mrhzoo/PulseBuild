from app.main import app


def test_documents_list_route_registered():
    paths = {getattr(r, "path", "") for r in app.routes}
    assert "/api/documents" in paths
    assert "/api/projects" in paths
