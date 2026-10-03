import os
from typing import Any, Dict, Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://127.0.0.1:8001").rstrip("/")
ML_SERVICE_TIMEOUT = float(os.getenv("ML_SERVICE_TIMEOUT", "15"))


class MLServiceError(Exception):
    """Raised when the independent ML service cannot be reached or responds with an error."""


class MLServiceClient:
    def __init__(self, base_url: str = ML_SERVICE_URL, timeout: float = ML_SERVICE_TIMEOUT):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def _request(self, method: str, path: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.request(method, f"{self.base_url}{path}", json=payload)
        except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as exc:
            raise MLServiceError(f"ML service unavailable at {self.base_url}: {exc}") from exc
        except httpx.HTTPError as exc:
            raise MLServiceError(f"ML service HTTP error: {exc}") from exc

        if response.status_code >= 400:
            try:
                detail = response.json().get("detail", response.text)
            except Exception:
                detail = response.text
            raise MLServiceError(f"ML service returned {response.status_code}: {detail}")

        try:
            return response.json()
        except ValueError as exc:
            raise MLServiceError("ML service returned invalid JSON") from exc

    async def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._request("POST", "/predict", data)

    async def simulate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._request("POST", "/simulate", data)

    async def anomaly(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._request("POST", "/anomaly", data)

    async def recommend(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._request("POST", "/recommend", data)

    async def health(self) -> Dict[str, Any]:
        return await self._request("GET", "/health")


ml_client = MLServiceClient()
