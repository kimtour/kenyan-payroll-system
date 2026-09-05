# Build KenPay from scratch

This guide explains the tools, project structure, setup, API, tests, GitHub automation and Render deployment.

## Tools and terms

| Item | Meaning | Purpose in KenPay |
| --- | --- | --- |
| Git | Version-control tool | Records source-code changes and sends them to GitHub. |
| GitHub | Hosted Git repository | Stores the project and runs automated checks. |
| `git clone` | Git command | Downloads a repository to your computer. |
| Python | Programming language | Runs the payroll engine and API. |
| VS Code | Code editor | Provides a file explorer, terminal, Python support and debugging. |
| Virtual environment | Isolated Python installation | Keeps this project's packages separate from other projects. |
| FastAPI | Python web framework | Creates typed HTTP endpoints and automatic API documentation. |
| Uvicorn | ASGI web server | Runs the FastAPI application. |
| Pydantic | Validation library | Checks request fields and rejects invalid values. |
| Decimal | Python number type | Avoids floating-point rounding errors in money calculations. |
| pytest | Testing framework | Runs calculation and API tests. |
| Ruff | Python linter | Finds code-quality and formatting problems. |
| Docker | Container format | Packages the application with a consistent runtime. |
| GitHub Actions | CI service | Runs tests automatically after every push. |
| Render | Cloud hosting service | Builds and publishes the Docker application. |
| REST API | HTTP interface | Lets other systems request payroll calculations. |
| JSON | Data format | Carries API requests and responses. |
| YAML | Configuration format | Defines CI and Render deployment settings. |

## 1. Install the software

Install Python 3.12, Git and VS Code. Add the official Python extension inside VS Code. Open VS Code, select **File**, **Open Folder**, and choose the project folder. Open the integrated terminal through **Terminal**, **New Terminal**.

## 2. Create or clone the project

Use this option to download the existing project:

```bash
git clone https://github.com/kimtour/kenyan-payroll-system.git # Download the GitHub repository.
cd kenyan-payroll-system # Move the terminal into the downloaded project folder.
code . # Open the current folder in VS Code.
```

Use this option to start an empty project:

```bash
mkdir kenyan-payroll-system # Create the main project folder.
cd kenyan-payroll-system # Enter the new project folder.
git init # Start Git version control in the folder.
mkdir app tests dist docs # Create backend, test, frontend and documentation folders.
touch app/__init__.py app/main.py app/calculator.py # Create the Python package and backend files.
touch tests/test_api.py tests/test_calculator.py # Create the automated test files.
touch dist/index.html dist/styles.css dist/app.js # Create the browser interface files.
```

## 3. Create the Python environment

```bash
python3 -m venv .venv # Create an isolated Python environment named .venv.
source .venv/bin/activate # Activate the environment on macOS or Linux.
python -m pip install --upgrade pip # Update the Python package installer.
pip install fastapi uvicorn pydantic pytest httpx ruff # Install the API, server, validation, testing and linting packages.
pip freeze > requirements-dev.txt # Record the exact development dependencies.
```

Windows PowerShell uses this activation command:

```powershell
.venv\Scripts\Activate.ps1 # Activate the virtual environment in Windows PowerShell.
```

## 4. Create the calculation engine

`app/calculator.py` contains statutory constants and pure calculation functions. Keeping it separate from the web framework makes the formulas easy to test.

```python
from decimal import Decimal, ROUND_HALF_UP  # Import exact decimal arithmetic and a money-rounding rule.
MONEY = Decimal("0.01")  # Define the required two-decimal currency precision.
SHIF_RATE = Decimal("0.0275")  # Store the SHIF rate as an exact decimal value.
def money(value: Decimal) -> Decimal:  # Define a reusable currency-rounding function.
    return value.quantize(MONEY, rounding=ROUND_HALF_UP)  # Round the supplied value to two decimal places.
```

The complete engine in `app/calculator.py` calculates gross pay, PAYE, NSSF Tier I and II, SHIF, Housing Levy, pension deductions, net pay and employer cost.

## 5. Create the FastAPI application

`app/main.py` defines validated request models and versioned endpoints.

```python
from decimal import Decimal  # Import the exact number type used for payroll money.
from fastapi import FastAPI  # Import the FastAPI application class.
from pydantic import BaseModel, Field  # Import typed request validation tools.
app = FastAPI(title="Kenyan Payroll API")  # Create the web API application.
class PayrollRequest(BaseModel):  # Define the accepted payroll request structure.
    basic_salary: Decimal = Field(ge=0)  # Require a salary greater than or equal to zero.
@app.get("/health")  # Register an HTTP GET health-check route.
def health() -> dict[str, str]:  # Define the health-check function and response type.
    return {"status": "healthy"}  # Return a simple success response for monitoring.
```

KenPay provides these endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Confirms the service is available. |
| GET | `/api/v1/rates` | Returns the active statutory configuration. |
| POST | `/api/v1/payroll/calculate` | Calculates one employee's monthly payroll. |
| POST | `/api/v1/payroll/batch` | Calculates payroll for up to 100 employees. |
| POST | `/api/v1/payroll/annual-projection` | Projects one employee's payroll across 1 to 12 months. |

## 6. Run the application

```bash
uvicorn app.main:app --reload # Start the API and restart it whenever source code changes.
```

Open `http://127.0.0.1:8000` for the dashboard and `http://127.0.0.1:8000/docs` for Swagger API documentation.

## 7. Send a test API request

```bash
curl -X POST -H "Content-Type: application/json" -d '{"basic_salary":120000,"allowances":15000,"pension":5000}' http://127.0.0.1:8000/api/v1/payroll/calculate # Send JSON payroll inputs to the calculation endpoint.
```

## 8. Create and run tests

Tests verify tax-band boundaries, NSSF limits, invalid inputs, endpoint responses, batch totals and annual projections.

```bash
pytest -q # Run every automated test and display a concise result.
ruff check app tests # Check the Python source and tests for quality problems.
node --check dist/app.js # Check the browser JavaScript for syntax errors.
```

## 9. Save the work in GitHub

```bash
git status # Show changed and untracked files before committing.
git add . # Stage all project files for the next commit.
git commit -m "Build Kenyan payroll system" # Save a named version in local Git history.
git branch -M main # Name the primary branch main.
git remote add origin https://github.com/YOUR-USERNAME/kenyan-payroll-system.git # Connect local Git to the GitHub repository.
git push -u origin main # Upload the main branch and remember its remote tracking branch.
```

## 10. Configure GitHub Actions

`.github/workflows/ci.yml` tells GitHub to test every push and pull request.

```yaml
name: CI # Display this workflow as CI in GitHub Actions.
on: [push, pull_request] # Start the workflow after a push or pull request.
jobs: # Begin the workflow's job collection.
  test: # Define a job named test.
    runs-on: ubuntu-latest # Use GitHub's current Ubuntu runner.
    steps: # Begin the ordered list of job tasks.
      - uses: actions/checkout@v4 # Download the repository into the runner.
      - uses: actions/setup-python@v5 # Install the requested Python runtime.
        with: # Supply settings to the Python setup action.
          python-version: "3.12" # Select Python version 3.12.
      - run: pip install -r requirements-dev.txt # Install project and test dependencies.
      - run: pytest -q # Run the automated test suite.
      - run: ruff check app tests # Run the Python quality checks.
```

## 11. Package with Docker

`Dockerfile` describes the production container. Each instruction creates a reproducible application environment.

```dockerfile
# Start with a small official Python 3.12 image.
FROM python:3.12-slim
# Set /app as the container's working directory.
WORKDIR /app
# Copy the production dependency list first for build caching.
COPY requirements.txt .
# Install production Python packages.
RUN pip install --no-cache-dir -r requirements.txt
# Copy the backend source into the container.
COPY app ./app
# Copy the browser interface into the container.
COPY dist ./dist
# Start Uvicorn on Render's assigned port.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

## 12. Deploy on Render

Create a Render account, select **New**, **Blueprint**, connect the GitHub repository, and choose the `render.yaml` file. Render reads the following settings:

```yaml
services: # Begin the list of cloud services.
  - type: web # Create a public HTTP web service.
    name: kenyan-payroll-system # Set the service name and default URL prefix.
    runtime: docker # Build the service from the Dockerfile.
    plan: free # Use Render's free service plan.
    healthCheckPath: /health # Ask Render to monitor the health endpoint.
    autoDeployTrigger: commit # Deploy new commits from the connected branch automatically.
```

After deployment, verify the dashboard, `/health`, `/docs`, `/api/v1/rates`, single calculation, batch calculation and annual projection endpoints.

## Project structure

| Path | Responsibility |
| --- | --- |
| `app/calculator.py` | Financial formulas and statutory constants. |
| `app/main.py` | FastAPI routes, validation and static dashboard hosting. |
| `dist/` | HTML, CSS and JavaScript user interface. |
| `tests/` | Unit and API test coverage. |
| `.github/workflows/ci.yml` | Automated GitHub test pipeline. |
| `Dockerfile` | Production container definition. |
| `render.yaml` | Render Blueprint deployment definition. |
| `requirements.txt` | Production Python dependencies. |
| `requirements-dev.txt` | Development and test dependencies. |
