# KenPay interview guide

## Public links

- [Live application](https://kenyan-payroll-system.onrender.com/)
- [Interactive API documentation](https://kenyan-payroll-system.onrender.com/docs)
- [Health check](https://kenyan-payroll-system.onrender.com/health)
- [Statutory rates endpoint](https://kenyan-payroll-system.onrender.com/api/v1/rates)
- [GitHub repository](https://github.com/kimtour/kenyan-payroll-system)
- [GitHub Actions](https://github.com/kimtour/kenyan-payroll-system/actions)
- [Static showcase backup](https://kenyan-payroll-system.kynkyra-9052.chatgpt.site)

## 60-second explanation

KenPay is a Kenyan payroll system built with FastAPI, Pydantic, Decimal arithmetic and a responsive JavaScript dashboard. It calculates PAYE, NSSF, SHIF, Affordable Housing Levy, employee net pay and total employer cost. The statutory rules are centralised, the API is versioned, and automated tests cover tax boundaries, contribution caps, invalid values and end-to-end API responses.

## Demonstration order

1. Open the live dashboard and review the payroll totals.
2. Select **Calculator** and change the salary or pension input.
3. Open the live `/docs` page to show the generated OpenAPI interface.
4. Open the live `/api/v1/rates` endpoint to show centralised policy data.
5. Open GitHub Actions to show the automated quality gate.

If Render is waking from inactivity, use the static showcase backup while it starts.

## Technical decisions

- `Decimal` and explicit two-decimal rounding prevent floating-point errors in payroll records.
- A separate calculation engine keeps tax logic independent from the web framework.
- Pydantic rejects negative input before calculations run.
- Versioned `/api/v1` routes allow future API changes without breaking clients.
- Docker and `render.yaml` make deployment repeatable.
- Anonymised demonstration records prevent personal payroll data exposure.

## Strong panel answer

“I separated the payroll rules from FastAPI so the business logic can be tested without the web layer. Each statutory figure is returned separately for auditability. The CI pipeline installs dependencies, checks code quality and runs unit plus API tests on every push. In production, I would add authentication, encrypted employee storage, role-based access, audit logs and statutory rate versioning by effective date.”
