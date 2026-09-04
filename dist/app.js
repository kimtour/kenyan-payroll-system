const KES = new Intl.NumberFormat('en-KE', {style:'currency',currency:'KES',minimumFractionDigits:2});
const shortKES = value => `KES ${Math.round(value).toLocaleString('en-KE')}`;

const employees = [
  {name:'Demo Employee A',role:'Product Manager',basic:185000,allowances:25000,tone:'#f3e7d2'},
  {name:'Demo Employee B',role:'Backend Engineer',basic:150000,allowances:18000,tone:'#dfeaf5'},
  {name:'Demo Employee C',role:'Finance Analyst',basic:118000,allowances:12000,tone:'#e2eee9'},
  {name:'Demo Employee D',role:'Support Specialist',basic:72000,allowances:8000,tone:'#e8e4f2'},
  {name:'Demo Employee E',role:'Office Administrator',basic:55000,allowances:5000,tone:'#f4e4e1'}
];

const initials = name => name.startsWith('Demo Employee ') ? name.slice(-1) : name.split(' ').map(x=>x[0]).join('');
function progressiveTax(pay){let remaining=Math.max(0,pay),tax=0;for(const [width,rate] of [[24000,.10],[8333,.25],[467667,.30],[300000,.325]]){const part=Math.min(remaining,width);tax+=part*rate;remaining-=part;if(remaining<=0)return tax}return tax+remaining*.35}
function calculate({basic=0,allowances=0,benefits=0,pension=0,other=0,resident=true}){const gross=basic+allowances+benefits;const tier1=Math.min(gross,9000)*.06;const tier2=Math.min(Math.max(gross-9000,0),99000)*.06;const nssf=tier1+tier2;const shif=gross?Math.max(300,gross*.0275):0;const ahl=gross*.015;const taxable=Math.max(0,gross-nssf-shif-ahl-Math.min(pension,30000));const taxBefore=progressiveTax(taxable);const relief=resident?Math.min(2400,taxBefore):0;const paye=Math.max(0,taxBefore-relief);const deductions=nssf+shif+ahl+paye+pension+other;return{gross,tier1,tier2,nssf,shif,ahl,taxable,taxBefore,relief,paye,pension,other,deductions,net:gross-deductions,employerCost:gross+nssf+ahl}}

const results=employees.map(e=>({...e,...calculate(e)}));
const totals=results.reduce((a,e)=>{for(const k of ['gross','paye','nssf','shif','ahl','net','employerCost'])a[k]=(a[k]||0)+e[k];return a},{});
document.querySelector('#summary-metrics').innerHTML=[
  ['Gross payroll',shortKES(totals.gross),'5 active employees','#c9a44e'],
  ['Net payroll',shortKES(totals.net),'Ready for approval','#21866f'],
  ['Statutory deductions',shortKES(totals.paye+totals.nssf+totals.shif+totals.ahl),'Reconciled automatically','#3b72ae'],
  ['Employer cost',shortKES(totals.employerCost),'Includes employer NSSF + AHL','#7166a9']
].map(([l,v,s,c])=>`<article class="metric" style="--accent:${c}"><span>${l}</span><strong>${v}</strong><small>${s}</small></article>`).join('');

document.querySelector('#employee-table').innerHTML=results.map(e=>`<tr><td><div class="person"><span class="avatar" style="--tone:${e.tone}">${initials(e.name)}</span><div><strong>${e.name}</strong><span>${e.role}</span></div></div></td><td class="money">${shortKES(e.gross)}</td><td class="money">${shortKES(e.paye+e.nssf+e.shif+e.ahl)}</td><td class="money"><strong>${shortKES(e.net)}</strong></td><td><span class="ready">Calculated</span></td></tr>`).join('');

const statutory=[['PAYE',totals.paye,'#c9a44e'],['NSSF',totals.nssf,'#3b72ae'],['SHIF',totals.shif,'#21866f'],['Housing Levy',totals.ahl,'#7166a9']];
const statTotal=statutory.reduce((a,x)=>a+x[1],0);let cursor=0;const stops=statutory.map(x=>{const start=cursor;cursor+=x[1]/statTotal*100;return `${x[2]} ${start}% ${cursor}%`}).join(',');
document.querySelector('#donut').style.background=`conic-gradient(${stops})`;document.querySelector('#stat-total').textContent=shortKES(statTotal);
document.querySelector('#stat-legend').innerHTML=statutory.map(([n,v,c])=>`<div class="legend-row"><i style="--color:${c}"></i><span>${n}</span><strong>${shortKES(v)}</strong></div>`).join('');

document.querySelector('#employee-cards').innerHTML=results.map(e=>`<article class="panel employee-card"><div class="person"><span class="avatar" style="--tone:${e.tone}">${initials(e.name)}</span><div><strong>${e.name}</strong><span>${e.role}</span></div></div><dl><div><dt>Gross pay</dt><dd>${shortKES(e.gross)}</dd></div><div><dt>Net pay</dt><dd>${shortKES(e.net)}</dd></div><div><dt>PAYE</dt><dd>${shortKES(e.paye)}</dd></div><div><dt>Employer cost</dt><dd>${shortKES(e.employerCost)}</dd></div></dl></article>`).join('');

function showView(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('.nav-link').forEach(n=>n.classList.toggle('active',n.dataset.view===id));location.hash=id;window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));document.querySelectorAll('[data-open-calculator]').forEach(b=>b.addEventListener('click',()=>showView('calculator')));

const form=document.querySelector('#payroll-form');
function updatePayslip(){const data={basic:+form.basic.value||0,allowances:+form.allowances.value||0,benefits:+form.benefits.value||0,pension:+form.pension.value||0,other:+form.other.value||0,resident:document.querySelector('#resident').checked};const r=calculate(data);document.querySelector('#net-pay').textContent=KES.format(r.net);document.querySelector('#gross-pay').textContent=KES.format(r.gross);document.querySelector('#employer-cost').textContent=KES.format(r.employerCost);document.querySelector('#payslip-lines').innerHTML=[['PAYE',r.paye],['NSSF, Tier I + II',r.nssf],['SHIF',r.shif],['Affordable Housing Levy',r.ahl],['Pension',r.pension],['Other deductions',r.other]].filter(x=>x[1]>0).map(([n,v])=>`<div class="line"><span>${n}</span><strong>− ${KES.format(v)}</strong></div>`).join('')+`<div class="line total"><span>Total deductions</span><strong>− ${KES.format(r.deductions)}</strong></div>`}
form.addEventListener('input',updatePayslip);form.addEventListener('reset',()=>setTimeout(updatePayslip));document.querySelector('#print-payslip').addEventListener('click',()=>window.print());updatePayslip();
const initial=location.hash.slice(1);if(['dashboard','calculator','employees','compliance'].includes(initial))showView(initial);
