"""Kenyan payroll calculation engine.

Rates reflect the KRA PAYE guide and NSSF Year 4 notice effective February 2026.
They are deliberately centralized so policy changes require one small edit.
"""

from dataclasses import asdict, dataclass
from decimal import Decimal, ROUND_HALF_UP


MONEY = Decimal("0.01")
PERSONAL_RELIEF = Decimal("2400")
SHIF_RATE = Decimal("0.0275")
SHIF_MINIMUM = Decimal("300")
HOUSING_LEVY_RATE = Decimal("0.015")
NSSF_RATE = Decimal("0.06")
NSSF_LOWER_LIMIT = Decimal("9000")
NSSF_UPPER_LIMIT = Decimal("108000")
PENSION_DEDUCTION_LIMIT = Decimal("30000")


def money(value: Decimal) -> Decimal:
    return value.quantize(MONEY, rounding=ROUND_HALF_UP)


def progressive_tax(taxable_pay: Decimal) -> Decimal:
    """Apply monthly resident individual income tax bands."""
    remaining = max(Decimal("0"), taxable_pay)
    tax = Decimal("0")
    bands = (
        (Decimal("24000"), Decimal("0.10")),
        (Decimal("8333"), Decimal("0.25")),
        (Decimal("467667"), Decimal("0.30")),
        (Decimal("300000"), Decimal("0.325")),
    )
    for width, rate in bands:
        portion = min(remaining, width)
        tax += portion * rate
        remaining -= portion
        if remaining <= 0:
            return money(tax)
    return money(tax + remaining * Decimal("0.35"))


def nssf_contribution(pensionable_pay: Decimal) -> tuple[Decimal, Decimal]:
    """Return employee Tier I and Tier II NSSF contributions."""
    pay = max(Decimal("0"), pensionable_pay)
    tier_one = min(pay, NSSF_LOWER_LIMIT) * NSSF_RATE
    tier_two_pay = min(max(pay - NSSF_LOWER_LIMIT, Decimal("0")), NSSF_UPPER_LIMIT - NSSF_LOWER_LIMIT)
    return money(tier_one), money(tier_two_pay * NSSF_RATE)


@dataclass(frozen=True)
class PayrollResult:
    gross_pay: Decimal
    nssf_tier_one: Decimal
    nssf_tier_two: Decimal
    nssf_employee: Decimal
    shif: Decimal
    housing_levy_employee: Decimal
    taxable_pay: Decimal
    tax_before_relief: Decimal
    personal_relief: Decimal
    paye: Decimal
    other_deductions: Decimal
    pension: Decimal
    total_deductions: Decimal
    net_pay: Decimal
    employer_nssf: Decimal
    housing_levy_employer: Decimal
    employer_cost: Decimal

    def to_dict(self) -> dict[str, float]:
        return {key: float(value) for key, value in asdict(self).items()}


def calculate_payroll(
    basic_salary: Decimal,
    allowances: Decimal = Decimal("0"),
    taxable_benefits: Decimal = Decimal("0"),
    pension: Decimal = Decimal("0"),
    other_deductions: Decimal = Decimal("0"),
    resident: bool = True,
) -> PayrollResult:
    values = (basic_salary, allowances, taxable_benefits, pension, other_deductions)
    if any(value < 0 for value in values):
        raise ValueError("Payroll amounts cannot be negative")

    gross = money(basic_salary + allowances + taxable_benefits)
    tier_one, tier_two = nssf_contribution(gross)
    nssf = money(tier_one + tier_two)
    shif = money(max(SHIF_MINIMUM, gross * SHIF_RATE)) if gross else Decimal("0.00")
    ahl_employee = money(gross * HOUSING_LEVY_RATE)
    allowable_pension = min(pension, PENSION_DEDUCTION_LIMIT)
    taxable = money(max(Decimal("0"), gross - nssf - shif - ahl_employee - allowable_pension))
    tax_before_relief = progressive_tax(taxable)
    relief = min(PERSONAL_RELIEF, tax_before_relief) if resident else Decimal("0.00")
    paye = money(max(Decimal("0"), tax_before_relief - relief))
    deductions = money(nssf + shif + ahl_employee + paye + pension + other_deductions)
    net = money(gross - deductions)
    employer_nssf = nssf
    ahl_employer = ahl_employee
    employer_cost = money(gross + employer_nssf + ahl_employer)

    return PayrollResult(
        gross, tier_one, tier_two, nssf, shif, ahl_employee, taxable,
        tax_before_relief, relief, paye, money(other_deductions), money(pension),
        deductions, net, employer_nssf, ahl_employer, employer_cost,
    )

