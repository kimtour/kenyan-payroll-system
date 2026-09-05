# KenPay demonstration guide

## Public links

- [Live application](https://kenyan-payroll-system.onrender.com/)
- [Interactive API documentation](https://kenyan-payroll-system.onrender.com/docs)
- [Health check](https://kenyan-payroll-system.onrender.com/health)
- [Statutory rates endpoint](https://kenyan-payroll-system.onrender.com/api/v1/rates)
- [GitHub repository](https://github.com/kimtour/kenyan-payroll-system)
- [GitHub Actions](https://github.com/kimtour/kenyan-payroll-system/actions)

## Two-minute demonstration

1. Open the dashboard and review gross payroll, net payroll, statutory deductions and employer cost.
2. Select **Calculator**, change the salary or pension, and print the updated payslip.
3. Select **Employees**, search for a Kenyan employee name, add a record, and export the payroll CSV.
4. Select **Reports** to show annual projections, employer costs and payroll ratios.
5. Open `/docs` to show the generated OpenAPI interface and the single, batch and annual projection endpoints.
6. Open GitHub Actions to show the automated test and code-quality checks.

## Technical decisions

- `Decimal` and explicit two-decimal rounding protect financial calculations from binary floating-point errors.
- A separate calculation engine keeps statutory logic independent from FastAPI.
- Pydantic rejects invalid input before calculations run.
- Versioned `/api/v1` routes protect existing integrations when the API changes.
- Docker and `render.yaml` make deployment repeatable.
- The dashboard uses sample employee data and keeps added records in the current browser session.

## Production extensions

A production release would add authentication, encrypted database storage, role-based access, audit logs, approval workflows, statutory filing integrations and rate versioning by effective date.
