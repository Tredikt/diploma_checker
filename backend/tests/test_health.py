from __future__ import annotations

from httpx import AsyncClient


async def test_health_returns_payload(client: AsyncClient) -> None:
  response = await client.get("/health")
  assert response.status_code == 200
  data = response.json()
  assert data["status"] in ("ok", "degraded")
  assert "database" in data
  assert "redis" in data
  assert "timestamp" in data
