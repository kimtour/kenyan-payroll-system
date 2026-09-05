"""FastAPI entry point for the Kenyan Payroll System."""

from decimal import Decimal
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.calculator import calculate_payroll, money


BASE_DIR = Path(__file__).resolve().parent.parent


app = FastAPI(
    title="Kenyan Payroll API",
    description="Auditable PAYE, NSSF, SHIF and Affordable Housing Levy calculations.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class PayrollRequest(BaseModel):
    basic_salary: Decimal = Field(ge=0, examples=[120000])
    allowances: Decimal = Field(default=Decimal("0"), ge=0, examples=[15000])
    taxable_benefits: Decimal = Field(default=Decimal("0"), ge=0)
    pension: Decimal = Field(default=Decimal("0"), ge=0)
    other_deductions: Decimal = Field(default=Decimal("0"), ge=0)
    resident: bool = True


class EmployeePayrollRequest(PayrollRequest):
    employee_id: str = Field(min_length=1, max_length=30, examples=["EMP-001"])
    name: str = Field(min_length=2, max_length=100, examples=["Samuel Kimani"])


class BatchPayrollRequest(BaseModel):
    employees: list[EmployeePayrollRequest] = Field(min_length=1, max_length=100)


class AnnualProjectionRequest(PayrollRequest):
    months: int = Field(default=12, ge=1, le=12)


@app.get("/health", tags=["Operations"])
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "kenyan-payroll-api"}


@app.post("/api/v1/payroll/calculate", tags=["Payroll"])
def calculate(request: PayrollRequest) -> dict[str, float]:
    try:
        return calculate_payroll(**request.model_dump()).to_dict()
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/api/v1/payroll/batch", tags=["Payroll"])
def calculate_batch(request: BatchPayrollRequest) -> dict:
    records = []
    for employee in request.employees:
        payroll_input = employee.model_dump(exclude={"employee_id", "name"})
        result = calculate_payroll(**payroll_input).to_dict()
        records.append(
            {"employee_id": employee.employee_id, "name": employee.name, **result}
        )

    total_fields = ("gross_pay", "total_deductions", "net_pay", "employer_cost")
    totals = {
        field: float(money(sum(Decimal(str(record[field])) for record in records)))
        for field in total_fields
    }
    return {"employee_count": len(records), "records": records, "totals": totals}


@app.post("/api/v1/payroll/annual-projection", tags=["Payroll"])
def annual_projection(request: AnnualProjectionRequest) -> dict:
    months = request.months
    payroll_input = request.model_dump(exclude={"months"})
    monthly = calculate_payroll(**payroll_input).to_dict()
    annual = {key: float(money(Decimal(str(value)) * months)) for key, value in monthly.items()}
    return {"months": months, "monthly": monthly, "projected": annual}


@app.get("/api/v1/rates", tags=["Payroll"])
def rates() -> dict:
    return {
        "effective_from": "2026-02-01",
        "currency": "KES",
        "paye_bands": [
            {"up_to": 24000, "rate": 0.10},
            {"up_to": 32333, "rate": 0.25},
            {"up_to": 500000, "rate": 0.30},
            {"up_to": 800000, "rate": 0.325},
            {"above": 800000, "rate": 0.35},
        ],
        "personal_relief": 2400,
        "shif_rate": 0.0275,
        "housing_levy_rate": 0.015,
        "nssf": {"rate": 0.06, "lower_limit": 9000, "upper_limit": 108000},
    }


# Register the dashboard last so API, health and OpenAPI routes take priority.
app.mount("/", StaticFiles(directory=BASE_DIR / "dist", html=True), name="dashboard")
