"""FastAPI entry point for the Kenyan Payroll System."""

from decimal import Decimal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.calculator import calculate_payroll


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
    allowances: Decimal = Field(default=0, ge=0, examples=[15000])
    taxable_benefits: Decimal = Field(default=0, ge=0)
    pension: Decimal = Field(default=0, ge=0)
    other_deductions: Decimal = Field(default=0, ge=0)
    resident: bool = True


@app.get("/health", tags=["Operations"])
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "kenyan-payroll-api"}


@app.post("/api/v1/payroll/calculate", tags=["Payroll"])
def calculate(request: PayrollRequest) -> dict[str, float]:
    try:
        return calculate_payroll(**request.model_dump()).to_dict()
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


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

