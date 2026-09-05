from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_dashboard_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "KenPay" in response.text
    assert "Reports" in response.text
    assert "employee-search" in response.text


def test_dashboard_assets_use_kenyan_names_and_exclude_removed_references():
    response = client.get("/app.js")
    assert response.status_code == 200
    assert "Samuel Kimani" in response.text
    assert "Wanjiku Njoroge" in response.text
    combined = client.get("/").text + response.text
    assert "Demo " + "Employee" not in combined
    assert "chatgpt" + ".site" not in combined
    assert "inter" + "view" not in combined.lower()


def test_rates_endpoint():
    response = client.get("/api/v1/rates")
    assert response.status_code == 200
    assert response.json()["nssf"]["upper_limit"] == 108000


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


def test_batch_payroll_endpoint():
    response = client.post(
        "/api/v1/payroll/batch",
        json={
            "employees": [
                {"employee_id": "EMP-001", "name": "Samuel Kimani", "basic_salary": 120000},
                {"employee_id": "EMP-002", "name": "Wanjiku Njoroge", "basic_salary": 80000},
            ]
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["employee_count"] == 2
    assert body["records"][0]["name"] == "Samuel Kimani"
    assert body["totals"]["gross_pay"] == 200000
    assert body["totals"]["net_pay"] == sum(record["net_pay"] for record in body["records"])


def test_annual_projection_endpoint():
    response = client.post(
        "/api/v1/payroll/annual-projection",
        json={"basic_salary": 120000, "allowances": 15000, "pension": 5000, "months": 12},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["months"] == 12
    assert body["monthly"]["net_pay"] == 90064.4
    assert body["projected"]["net_pay"] == 1080772.8


def test_batch_payroll_requires_an_employee():
    response = client.post("/api/v1/payroll/batch", json={"employees": []})
    assert response.status_code == 422
