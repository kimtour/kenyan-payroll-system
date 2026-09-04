from decimal import Decimal
import unittest

from app.calculator import calculate_payroll, nssf_contribution, progressive_tax


class PayrollCalculatorTests(unittest.TestCase):
    def test_paye_band_boundaries(self):
        self.assertEqual(progressive_tax(Decimal("24000")), Decimal("2400.00"))
        self.assertEqual(progressive_tax(Decimal("32333")), Decimal("4483.25"))
        self.assertEqual(progressive_tax(Decimal("500000")), Decimal("144783.35"))
        self.assertEqual(progressive_tax(Decimal("800000")), Decimal("242283.35"))

    def test_nssf_2026_tiers(self):
        cases = [
            ("8000", "480.00", "0.00"),
            ("30000", "540.00", "1260.00"),
            ("108000", "540.00", "5940.00"),
            ("150000", "540.00", "5940.00"),
        ]
        for salary, tier_one, tier_two in cases:
            with self.subTest(salary=salary):
                self.assertEqual(
                    nssf_contribution(Decimal(salary)),
                    (Decimal(tier_one), Decimal(tier_two)),
                )

    def test_complete_payroll_is_reconciled(self):
        result = calculate_payroll(
            basic_salary=Decimal("120000"),
            allowances=Decimal("15000"),
            pension=Decimal("5000"),
        )
        self.assertEqual(result.gross_pay, Decimal("135000.00"))
        self.assertEqual(result.nssf_employee, Decimal("6480.00"))
        self.assertEqual(result.shif, Decimal("3712.50"))
        self.assertEqual(result.housing_levy_employee, Decimal("2025.00"))
        self.assertEqual(result.taxable_pay, Decimal("117782.50"))
        self.assertEqual(result.paye, Decimal("27718.10"))
        self.assertEqual(result.net_pay, Decimal("90064.40"))
        self.assertEqual(result.gross_pay - result.total_deductions, result.net_pay)
        self.assertEqual(result.employer_cost, Decimal("143505.00"))

    def test_zero_salary_has_zero_deductions(self):
        result = calculate_payroll(Decimal("0"))
        self.assertEqual(result.net_pay, Decimal("0.00"))
        self.assertEqual(result.shif, Decimal("0.00"))

    def test_negative_amount_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "cannot be negative"):
            calculate_payroll(Decimal("-1"))
