"""Healthcheck endpoint tests."""
from __future__ import annotations

import pytest


@pytest.mark.django_db
def test_health_basico_retorna_ok(client):
    resp = client.get("/api/health/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "version" in body
    # Liveness probe não deve depender de DB.
    assert "db" not in body


@pytest.mark.django_db
def test_health_deep_inclui_status_do_db(client):
    resp = client.get("/api/health/?deep=1")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["db"] == "ok"
