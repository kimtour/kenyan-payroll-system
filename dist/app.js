const KES = new Intl.NumberFormat('en-KE', {
  style: 'currency', currency: 'KES', minimumFractionDigits: 2,
});
const shortKES = value => `KES ${Math.round(value).toLocaleString('en-KE')}`;
const escapeHTML = value => String(value).replace(/[&<>'"]/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'})[character]);

let employees = [
  {id: 'EMP-001', name: 'Samuel Kimani', role: 'Product Manager', basic: 185000, allowances: 25000, tone: '#f3e7d2'},
  {id: 'EMP-002', name: 'Wanjiku Njoroge', role: 'Backend Engineer', basic: 150000, allowances: 18000, tone: '#dfeaf5'},
  {id: 'EMP-003', name: 'Brian Otieno', role: 'Finance Analyst', basic: 118000, allowances: 12000, tone: '#e2eee9'},
  {id: 'EMP-004', name: 'Amina Hassan', role: 'Support Specialist', basic: 72000, allowances: 8000, tone: '#e8e4f2'},
  {id: 'EMP-005', name: 'Faith Wambui', role: 'Office Administrator', basic: 55000, allowances: 5000, tone: '#f4e4e1'},
];

const initials = name => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();

function progressiveTax(pay) {
  let remaining = Math.max(0, pay);
  let tax = 0;
  for (const [width, rate] of [[24000, .10], [8333, .25], [467667, .30], [300000, .325]]) {
    const portion = Math.min(remaining, width);
    tax += portion * rate;
    remaining -= portion;
    if (remaining <= 0) return tax;
  }
  return tax + remaining * .35;
}

function calculate({basic = 0, allowances = 0, benefits = 0, pension = 0, other = 0, resident = true}) {
  const gross = basic + allowances + benefits;
  const tier1 = Math.min(gross, 9000) * .06;
  const tier2 = Math.min(Math.max(gross - 9000, 0), 99000) * .06;
  const nssf = tier1 + tier2;
  const shif = gross ? Math.max(300, gross * .0275) : 0;
  const ahl = gross * .015;
  const taxable = Math.max(0, gross - nssf - shif - ahl - Math.min(pension, 30000));
  const taxBefore = progressiveTax(taxable);
  const relief = resident ? Math.min(2400, taxBefore) : 0;
  const paye = Math.max(0, taxBefore - relief);
  const deductions = nssf + shif + ahl + paye + pension + other;
  return {gross, tier1, tier2, nssf, shif, ahl, taxable, taxBefore, relief, paye, pension, other, deductions, net: gross - deductions, employerCost: gross + nssf + ahl};
}

const payrollResults = () => employees.map(employee => ({...employee, ...calculate(employee)}));
function payrollTotals(results) {
  return results.reduce((totals, employee) => {
    for (const key of ['gross', 'paye', 'nssf', 'shif', 'ahl', 'net', 'deductions', 'employerCost']) totals[key] = (totals[key] || 0) + employee[key];
    return totals;
  }, {});
}

function metricCards(items) {
  return items.map(([label, value, status, color]) => `<article class="metric" style="--accent:${color}"><span>${label}</span><strong>${value}</strong><small>${status}</small></article>`).join('');
}

function renderDashboard() {
  const results = payrollResults();
  const totals = payrollTotals(results);
  document.querySelector('#employee-summary').textContent = `${results.length} employees, calculated under current Kenyan statutory rules.`;
  document.querySelector('#summary-metrics').innerHTML = metricCards([
    ['Gross payroll', shortKES(totals.gross), `${results.length} active employees`, '#c9a44e'],
    ['Net payroll', shortKES(totals.net), 'Ready for approval', '#21866f'],
    ['Statutory deductions', shortKES(totals.paye + totals.nssf + totals.shif + totals.ahl), 'Reconciled automatically', '#3b72ae'],
    ['Employer cost', shortKES(totals.employerCost), 'Includes employer NSSF + AHL', '#7166a9'],
  ]);
  document.querySelector('#employee-table').innerHTML = results.map(employee => `<tr><td><div class="person"><span class="avatar" style="--tone:${employee.tone}">${initials(employee.name)}</span><div><strong>${escapeHTML(employee.name)}</strong><span>${escapeHTML(employee.role)}</span></div></div></td><td class="money">${shortKES(employee.gross)}</td><td class="money">${shortKES(employee.paye + employee.nssf + employee.shif + employee.ahl)}</td><td class="money"><strong>${shortKES(employee.net)}</strong></td><td><span class="ready">Calculated</span></td></tr>`).join('');
  const statutory = [['PAYE', totals.paye, '#c9a44e'], ['NSSF', totals.nssf, '#3b72ae'], ['SHIF', totals.shif, '#21866f'], ['Housing Levy', totals.ahl, '#7166a9']];
  const statTotal = statutory.reduce((sum, item) => sum + item[1], 0);
  let cursor = 0;
  const stops = statutory.map(item => { const start = cursor; cursor += item[1] / statTotal * 100; return `${item[2]} ${start}% ${cursor}%`; }).join(',');
  document.querySelector('#donut').style.background = `conic-gradient(${stops})`;
  document.querySelector('#stat-total').textContent = shortKES(statTotal);
  document.querySelector('#stat-legend').innerHTML = statutory.map(([name, value, color]) => `<div class="legend-row"><i style="--color:${color}"></i><span>${name}</span><strong>${shortKES(value)}</strong></div>`).join('');
}

function renderEmployees(query = '') {
  const term = query.trim().toLowerCase();
  const records = payrollResults().filter(employee => `${employee.name} ${employee.role}`.toLowerCase().includes(term));
  const container = document.querySelector('#employee-cards');
  if (!records.length) { container.innerHTML = '<p class="empty-state">No employee matches your search.</p>'; return; }
  container.innerHTML = records.map(employee => `<article class="panel employee-card"><div class="person"><span class="avatar" style="--tone:${employee.tone}">${initials(employee.name)}</span><div><strong>${escapeHTML(employee.name)}</strong><span>${escapeHTML(employee.role)}</span></div></div><small class="employee-id">${employee.id}</small><dl><div><dt>Gross pay</dt><dd>${shortKES(employee.gross)}</dd></div><div><dt>Net pay</dt><dd>${shortKES(employee.net)}</dd></div><div><dt>PAYE</dt><dd>${shortKES(employee.paye)}</dd></div><div><dt>Employer cost</dt><dd>${shortKES(employee.employerCost)}</dd></div></dl></article>`).join('');
}

function renderReports() {
  const totals = payrollTotals(payrollResults());
  const statutory = totals.paye + totals.nssf + totals.shif + totals.ahl;
  document.querySelector('#report-metrics').innerHTML = metricCards([
    ['Annual gross payroll', shortKES(totals.gross * 12), '12-month projection', '#c9a44e'],
    ['Annual net payroll', shortKES(totals.net * 12), '12-month projection', '#21866f'],
    ['Annual employer cost', shortKES(totals.employerCost * 12), '12-month projection', '#7166a9'],
    ['Monthly statutory total', shortKES(statutory), 'PAYE, NSSF, SHIF and AHL', '#3b72ae'],
  ]);
  const months = Array.from({length: 12}, (_, index) => new Date(2026, index).toLocaleString('en-KE', {month: 'short'}));
  document.querySelector('#cost-bars').innerHTML = months.map(month => `<div class="bar-column" title="${month}: ${KES.format(totals.employerCost)}"><div class="bar" style="height:100%"></div><span>${month}</span></div>`).join('');
  const ratios = [
    ['Net pay as percentage of gross', totals.net / totals.gross * 100],
    ['Statutory deductions as percentage of gross', statutory / totals.gross * 100],
    ['Employer additions as percentage of gross', (totals.employerCost - totals.gross) / totals.gross * 100],
  ];
  document.querySelector('#payroll-ratios').innerHTML = ratios.map(([label, value]) => `<div class="ratio"><div><span>${label}</span><strong>${value.toFixed(1)}%</strong></div><progress max="100" value="${value}">${value.toFixed(1)}%</progress></div>`).join('');
}

function showView(id) {
  document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === id));
  document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === id));
  location.hash = id;
  window.scrollTo({top: 0, behavior: 'smooth'});
}

const form = document.querySelector('#payroll-form');
function updatePayslip() {
  const result = calculate({basic: +form.basic.value || 0, allowances: +form.allowances.value || 0, benefits: +form.benefits.value || 0, pension: +form.pension.value || 0, other: +form.other.value || 0, resident: document.querySelector('#resident').checked});
  document.querySelector('#payslip-employee').textContent = form.employeeName.value.trim() || 'Employee';
  document.querySelector('#net-pay').textContent = KES.format(result.net);
  document.querySelector('#gross-pay').textContent = KES.format(result.gross);
  document.querySelector('#employer-cost').textContent = KES.format(result.employerCost);
  document.querySelector('#payslip-lines').innerHTML = [['PAYE', result.paye], ['NSSF, Tier I + II', result.nssf], ['SHIF', result.shif], ['Affordable Housing Levy', result.ahl], ['Pension', result.pension], ['Other deductions', result.other]].filter(item => item[1] > 0).map(([name, value]) => `<div class="line"><span>${name}</span><strong>− ${KES.format(value)}</strong></div>`).join('') + `<div class="line total"><span>Total deductions</span><strong>− ${KES.format(result.deductions)}</strong></div>`;
}

function exportPayrollCsv() {
  const headings = ['Employee ID', 'Name', 'Role', 'Gross Pay', 'PAYE', 'NSSF', 'SHIF', 'Housing Levy', 'Total Deductions', 'Net Pay', 'Employer Cost'];
  const rows = payrollResults().map(employee => [employee.id, employee.name, employee.role, employee.gross, employee.paye, employee.nssf, employee.shif, employee.ahl, employee.deductions, employee.net, employee.employerCost]);
  const csv = [headings, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'}));
  link.download = 'kenpay-september-2026.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

document.querySelectorAll('.nav-link').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
document.querySelectorAll('[data-open-calculator]').forEach(button => button.addEventListener('click', () => showView('calculator')));
form.addEventListener('input', updatePayslip);
form.addEventListener('reset', () => setTimeout(updatePayslip));
document.querySelector('#print-payslip').addEventListener('click', () => window.print());
document.querySelector('#employee-search').addEventListener('input', event => renderEmployees(event.target.value));
document.querySelector('#export-csv').addEventListener('click', exportPayrollCsv);
document.querySelector('#reports-export').addEventListener('click', exportPayrollCsv);

const dialog = document.querySelector('#employee-dialog');
const employeeForm = document.querySelector('#employee-form');
document.querySelector('#add-employee').addEventListener('click', () => dialog.showModal());
document.querySelector('#save-employee').addEventListener('click', event => {
  if (!employeeForm.reportValidity()) { event.preventDefault(); return; }
  const data = new FormData(employeeForm);
  employees.push({id: `EMP-${String(employees.length + 1).padStart(3, '0')}`, name: data.get('name').trim(), role: data.get('role').trim(), basic: +data.get('basic'), allowances: +data.get('allowances'), tone: '#e1e9f3'});
  renderDashboard(); renderEmployees(); renderReports(); employeeForm.reset();
});

renderDashboard(); renderEmployees(); renderReports(); updatePayslip();
const initialView = location.hash.slice(1);
if (['dashboard', 'calculator', 'employees', 'reports', 'compliance'].includes(initialView)) showView(initialView);
