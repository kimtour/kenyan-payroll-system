from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_calculate_endpoint():
    response = client.post(
        "/api/v1/payroll/calculate",
        json={"basic_salary": 120000, "allowances": 15000, "pension": 5000},
    )
    assert response.status_code == 200
    assert response.json()["net_pay"] == 90064.4


def test_validation_error():
    response = client.post("/api/v1/payroll/calculate", json={"basic_salary": -1})
    assert response.status_code == 422
