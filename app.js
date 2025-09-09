const form = document.getElementById('form');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const tblBody = document.querySelector('#table tbody');

const fields = ["position","company","location","priority","status","date"];
const inputs = Object.fromEntries(fields.map(id => [id, document.getElementById(id)]));

const q = document.getElementById('q');
const fStatus = document.getElementById('fStatus');
const fPriority = document.getElementById('fPriority');

const exportCsv = document.getElementById('exportCsv');
const exportJson = document.getElementById('exportJson');
const importJson = document.getElementById('importJson');

let items = JSON.parse(localStorage.getItem('apps') || '[]');
let editingId = null;
let sortKey = 'applied'; let sortAsc = false;

function uid(){ return Date.now() + Math.random().toString(16).slice(2); }

function save() { localStorage.setItem('apps', JSON.stringify(items)); render(); }

function toBadge(text, cls){ return `<span class="badge ${cls}">${text}</span>`; }

function render(){
  const query = q.value.trim().toLowerCase();
  const s = fStatus.value, p = fPriority.value;

  let rows = items.filter(r =>
    (!s || r.status===s) &&
    (!p || r.priority===p) &&
    (r.company.toLowerCase().includes(query) || r.position.toLowerCase().includes(query))
  );

  rows.sort((a,b)=>{
    let x=a[sortKey]||'', y=b[sortKey]||'';
    if(sortKey==='applied'){ x = x || ''; y = y || ''; }
    return (x>y?1:x<y?-1:0) * (sortAsc?1:-1);
  });

  tblBody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.position}</td>
      <td>${r.company}</td>
      <td>${toBadge(r.priority, 'p'+r.priority)}</td>
      <td>${r.location}</td>
      <td>${toBadge(r.status, 's'+r.status)}</td>
      <td>${r.applied || ''}</td>
      <td class="actions">
        <button onclick="editItem('${r.id}')">Edit</button>
        <button class="danger" onclick="delItem('${r.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

window.editItem = id => {
  const r = items.find(x=>x.id===id); if(!r) return;
  editingId = id;
  inputs.position.value = r.position;
  inputs.company.value = r.company;
  inputs.location.value = r.location;
  inputs.priority.value = r.priority;
  inputs.status.value = r.status;
  inputs.date.value = r.applied || '';
  saveBtn.textContent = 'Update';
  inputs.position.focus();
};

window.delItem = id => {
  if (!confirm('Delete this record?')) return;
  items = items.filter(x=>x.id!==id); save();
};

form.addEventListener('submit', e => {
  e.preventDefault();
  const rec = {
    position: inputs.position.value.trim(),
    company: inputs.company.value.trim(),
    location: inputs.location.value.trim(),
    priority: inputs.priority.value,
    status: inputs.status.value,
    applied: inputs.date.value || '',
  };
  if (editingId){
    Object.assign(items.find(x=>x.id===editingId), rec);
    editingId = null; saveBtn.textContent = 'Add';
  } else {
    items.push({ id: uid(), ...rec });
  }
  form.reset(); save();
});

resetBtn.onclick = ()=>{ editingId=null; saveBtn.textContent='Add'; form.reset(); };

[q, fStatus, fPriority].forEach(el => el.addEventListener('input', render));

document.querySelectorAll('th[data-sort]').forEach(th=>{
  th.addEventListener('click', ()=>{
    const key = th.getAttribute('data-sort');
    if (sortKey === key) sortAsc = !sortAsc; else { sortKey = key; sortAsc = true; }
    render();
  });
});

exportCsv.onclick = () => {
  const header = ["position","company","priority","location","status","applied"];
  const csv = [header.join(",")].concat(
    items.map(r=>header.map(k=>`"${(r[k]||'').toString().replace(/"/g,'""')}"`).join(","))
  ).join("\n");
  download("applications.csv", csv, "text/csv");
};

exportJson.onclick = () => {
  download("applications.json", JSON.stringify(items, null, 2), "application/json");
};

importJson.onchange = (e) => {
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if(Array.isArray(data)){ items = data; save(); alert("Imported!"); }
      else alert("Invalid JSON.");
    } catch { alert("Could not parse JSON."); }
  };
  reader.readAsText(file);
};

function download(name, content, type){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], {type}));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

// Seed example rows for first-time users
if(items.length===0){
  items = [
    {id:uid(), position:"Intern, Software Engineering", company:"NVIDIA", priority:"High", location:"Zurich", status:"Applied", applied:new Date().toISOString().slice(0,10)},
    {id:uid(), position:"Intern, AI Engineer", company:"YUUniQ Health", priority:"High", location:"Winterthur", status:"Applied", applied:new Date().toISOString().slice(0,10)},
    {id:uid(), position:"Intern, IT Support", company:"MOIA", priority:"Medium", location:"Hamburg", status:"Interview", applied:new Date().toISOString().slice(0,10)}
  ];
  save();
} else {
  render();
}
