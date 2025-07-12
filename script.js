// Data - saved as arrays for demo; would use DB in production
let hospitals = [];
let doctors = [];
let patients = [];
let appointments = [];

// -- NAVIGATION --
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = '';
  refreshSelects();
  if(id === 'dashboard-hospital') showHospitalDashboard();
  if(id === 'dashboard-doctor') showDoctorDashboard();
  if(id === 'patient-history') showPatientHistory();
  if(id === 'register-hospital') renderHospitalList();
  if(id === 'register-doctor') renderDoctorsList();
  if(id === 'register-patient') renderPatientsList();
}
showSection('register-hospital');

// -- HOSPITAL REGISTRATION & MGMT --
function registerHospital(e){
  e.preventDefault();
  const name = document.getElementById('hospital-name').value.trim();
  const location = document.getElementById('hospital-location').value.trim();
  const departments = document.getElementById('hospital-departments').value.split(',').map(s=>s.trim()).filter(Boolean);
  if(!name || !location || !departments.length) return;
  if(hospitals.some(h => h.name === name)) return alert('Hospital already exists!');
  hospitals.push({name, location, departments, doctors: []});
  document.getElementById('hospital-name').value = '';
  document.getElementById('hospital-location').value = '';
  document.getElementById('hospital-departments').value = '';
  renderHospitalList();
  refreshSelects();
}
function renderHospitalList(){
  let html = "";
  for (const h of hospitals) {
    html += `<div>
      <strong>${h.name} (${h.location})</strong> <br>Departments: ${h.departments.join(', ')}
    </div>`;
  }
  document.getElementById('hospitals-list').innerHTML = html || "<em>No hospitals yet.</em>";
}

// -- DOCTOR REGISTRATION & MGMT --
function registerDoctor(e){
  e.preventDefault();
  const name = document.getElementById('doctor-name').value.trim();
  const qualifications = document.getElementById('doctor-qualifications').value.trim();
  const specializations = document.getElementById('doctor-specializations').value.split(',').map(s=>s.trim()).filter(Boolean);
  const experience = +document.getElementById('doctor-experience').value;
  if(!name || !qualifications || !specializations.length || !experience) return;
  if(doctors.some(d => d.name === name)) return alert('Doctor already exists!');
  doctors.push({name, qualifications, specializations, experience, hospitals: [], availability: []});
  document.getElementById('doctor-name').value = '';
  document.getElementById('doctor-qualifications').value = '';
  document.getElementById('doctor-specializations').value = '';
  document.getElementById('doctor-experience').value = '';
  renderDoctorsList();
  refreshSelects();
}
function renderDoctorsList(){
  let html = "";
  for(const [i, d] of doctors.entries()){
    html += `<div>
      <strong>${d.name}</strong> (${d.qualifications}) | Specializations: ${d.specializations.join(', ')} | Exp: ${d.experience} yr(s)
      <button onclick="showHospitalAssociation(${i})">Associate Hospital</button>
    </div>`;
  }
  document.getElementById('doctors-list').innerHTML = html || "<em>No doctors yet.</em>";
}
function showHospitalAssociation(i){
  let d = doctors[i];
  let html = `<div style="margin:10px 0"><strong>Associate ${d.name} with Hospital</strong>
    <form onsubmit="associateDoctor(event,${i})">
      <select id="hospital-associate-select" required>
        <option value="">Select Hospital</option>
        ${
          hospitals.map((h,idx)=>(
            d.hospitals.find(hh=>hh.hospital===h.name)?'':
            `<option value="${idx}">${h.name} (${h.location})</option>`
          )).join('')
        }
      </select>
      <select id="dept-associate-select" required>
        <option value="">Department</option>
      </select>
      <input type="number" id="associate-fee" placeholder="Consultation Fee" min="0" required>
      <button type="submit">Associate</button>
    </form>
    <div><button onclick="showAvailabilityForm(${i})">Set Availability</button></div>
  </div>`;
  document.getElementById('associate-hospital').innerHTML = html;
  document.getElementById("hospital-associate-select").onchange = (e) => updateDeptSelect(i, e.target.value);
}
function updateDeptSelect(doctorIdx, hospIndex){
  let d = doctors[doctorIdx];
  let deptSel = document.getElementById('dept-associate-select');
  if (!deptSel) return;
  deptSel.innerHTML = '<option value="">Department</option>';
  if(!hospIndex) return;
  const hosp = hospitals[hospIndex];
  const validDepts = hosp.departments.filter(dept=>d.specializations.includes(dept));
  for (const dept of validDepts) {
    const opt = document.createElement('option');
    opt.textContent = dept; opt.value = dept;
    deptSel.appendChild(opt);
  }
}
function associateDoctor(e,docIdx){
  e.preventDefault();
  let hospitalIndex = +document.getElementById('hospital-associate-select').value;
  let dept = document.getElementById('dept-associate-select').value;
  let fee = +document.getElementById('associate-fee').value;
  if(hospitals[hospitalIndex] && dept && fee > 0){
    let doc = doctors[docIdx];
    doc.hospitals.push({hospital: hospitals[hospitalIndex].name, department: dept, fee});
    hospitals[hospitalIndex].doctors.push(doc.name);
    renderDoctorsList();
    document.getElementById('associate-hospital').innerHTML = '';
  }
}
function showAvailabilityForm(docIdx){
  let doc = doctors[docIdx];
  if(doc.hospitals.length===0) return alert('Associate a hospital first.');
  let availHtml = `<form onsubmit="addDoctorSlot(event,${docIdx})">
    <select id="slot-hospital">
      ${doc.hospitals.map((h,idx)=>`<option value="${idx}">${h.hospital} (${h.department})</option>`).join('')}
    </select>
    <input type="date" id="slot-date" required>
    <input type="time" id="slot-from" required>
    <input type="time" id="slot-to" required>
    <button type="submit">Add Slot</button>
  </form>`;
  document.getElementById('associate-hospital').innerHTML = availHtml;
}
function addDoctorSlot(e,docIdx){
  e.preventDefault();
  let doc = doctors[docIdx];
  let hospIdx = +document.getElementById('slot-hospital').value;
  let date = document.getElementById('slot-date').value;
  let from = document.getElementById('slot-from').value;
  let to = document.getElementById('slot-to').value;
  if(!date||!from||!to||from>=to) return alert("Enter valid times!");
  // Check for conflicts
  let slot = {hospital: doc.hospitals[hospIdx].hospital, date, from, to, department: doc.hospitals[hospIdx].department};
  for(let s of doc.availability){
    if(s.hospital===slot.hospital && s.date===slot.date && ((from < s.to && to > s.from))) // overlap
      return alert('Time conflict within hospital!');
  }
  for(let s of doc.availability){
    if(s.date===slot.date && ((from < s.to && to > s.from)))
      return alert('Time conflict with your other hospitals!');
  }
  doc.availability.push(slot);
  document.getElementById('associate-hospital').innerHTML = '';
}

// -- PATIENT REGISTRATION --
function registerPatient(e){
  e.preventDefault();
  const name = document.getElementById('patient-name').value.trim();
  const gender = document.getElementById('patient-gender').value;
  const dob = document.getElementById('patient-dob').value;
  const id = document.getElementById('patient-id').value.trim();
  if(!name || !gender || !dob || !id) return;
  if(patients.some(p=>p.id===id)) return alert('ID already used!');
  patients.push({name, gender, dob, id, history: []});
  document.getElementById('patient-name').value = '';
  document.getElementById('patient-gender').value = '';
  document.getElementById('patient-dob').value = '';
  document.getElementById('patient-id').value = '';
  renderPatientsList();
  refreshSelects();
}
function renderPatientsList(){
  let html = "";
  for(const p of patients){
    html += `<div><strong>${p.name}</strong> (${p.gender}, ${p.dob}) ID: ${p.id}</div>`;
  }
  document.getElementById('patients-list').innerHTML = html || "<em>No patients yet.</em>";
}

// -- APPOINTMENT BOOKING --
function searchDoctors(e){
  e.preventDefault();
  let spec = document.getElementById('filter-specialization').value.trim();
  let hosp = document.getElementById('filter-hospital').value.trim();
  let date = document.getElementById('filter-date').value;
  let results = [];
  for(const d of doctors){
    for(const a of d.availability){
      if( (!spec || d.specializations.includes(spec)) &&
          (!hosp || a.hospital===hosp) &&
          (!date || a.date===date)&&
          !appointments.find(ap=>ap.doctor===d.name && ap.hospital===a.hospital && ap.date===a.date && ap.from===a.from)
      ){
        results.push({doctor: d, slot: a});
      }
    }
  }
  let html = results.length ? "<table><tr><th>Doctor</th><th>Hospital</th><th>Date</th><th>From</th><th>To</th><th>Fee</th><th>Patient</th><th>Action</th></tr>" : "<em>No available slots found.</em>";
  if(results.length)
  for(const r of results){
    let docHosp = r.doctor.hospitals.find(h=>h.hospital===r.slot.hospital);
    html += `<tr>
      <td>${r.doctor.name}</td>
      <td>${r.slot.hospital} (${r.slot.department})</td>
      <td>${r.slot.date}</td>
      <td>${r.slot.from}</td>
      <td>${r.slot.to}</td>
      <td>${docHosp?docHosp.fee:''}</td>
      <td>
        <select id="appoint-patient-${results.indexOf(r)}">
        ${patients.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
      </td>
      <td>
        <button onclick="bookSlot('${r.doctor.name}','${r.slot.hospital}','${r.slot.department}','${r.slot.date}','${r.slot.from}','${r.slot.to}',${docHosp?docHosp.fee:0},${results.indexOf(r)})">
        Book
        </button>
      </td>
    </tr>`;
  }
  html += results.length?"</table>":"";
  document.getElementById('search-results').innerHTML = html;
}
function bookSlot(doctor,hospital,department,date,from,to,fee,resIdx){
  let patientId = document.getElementById('appoint-patient-'+resIdx).value;
  if(!patientId) return alert('Select patient.');
  let paid = prompt(`Consultation Fee is ₹${fee}. Enter amount paid:`);
  let amt = parseInt(paid,10);
  if(isNaN(amt)||amt<fee) return alert("Must pay fee!");
  appointments.push({doctor,hospital,department,date,from,to,fee,amt,patientId});
  let patient = patients.find(p=>p.id===patientId);
  patient.history.push({doctor,hospital,department,date,from,to,fee,amt});
  alert('Appointment booked!');
  searchDoctors({preventDefault:()=>{}});
}

// ------------------- DASHBOARDS ------------------
function refreshSelects(){
  let hospSel = document.getElementById('dashboard-hospital-select');
  if(hospSel)
    hospSel.innerHTML = hospitals.map(h=>`<option value="${h.name}">${h.name}</option>`).join('');
  let docSel = document.getElementById('dashboard-doctor-select');
  if(docSel)
    docSel.innerHTML = doctors.map(d=>`<option value="${d.name}">${d.name}</option>`).join('');
  let patSel = document.getElementById('dashboard-patient-select');
  if(patSel)
    patSel.innerHTML = patients.map(p=>`<option value="${p.id}">${p.name} (${p.id})</option>`).join('');
}
function showHospitalDashboard(){
  let name = document.getElementById('dashboard-hospital-select').value;
  let hosp = hospitals.find(h=>h.name===name);
  if(!hosp) return;
  let docList = hosp.doctors.map(docName=>doctors.find(d=>d.name===docName)).filter(Boolean);
  let totalConsults = appointments.filter(a=>a.hospital===hosp.name).length;
  let totalRevenue = appointments.filter(a=>a.hospital===hosp.name).reduce((s,a)=>s+a.fee,0);
  // Per-doctor Revenue
  let perDoc = {};
  for(let d of docList){
    perDoc[d.name] = appointments.filter(a=>a.hospital===hosp.name && a.doctor===d.name).reduce((s,a)=>s+a.fee,0);
  }
  // Per-department Revenue
  let perDept = {};
  for(let dept of hosp.departments){
    perDept[dept] = appointments.filter(a=>a.hospital===hosp.name&&a.department===dept).reduce((s,a)=>s+a.fee,0);
  }
  let html = `<h3>Doctors:</h3><ul>${docList.map(d=>`<li>${d.name} [${d.specializations.join(',')}], Exp: ${d.experience}yr</li>`).join('')}</ul>`;
  html += `<div>Total Consultations: <b>${totalConsults}</b></div>`;
  html += `<div>Total Revenue: <b>₹${totalRevenue}</b> (Hospital: ₹${(totalRevenue*0.4).toFixed(0)}, Doctors: ₹${(totalRevenue*0.6).toFixed(0)})</div>`;
  html += `<h4>Revenue Per Doctor</h4><ul>`+Object.entries(perDoc).map(([doc,rev])=>`<li>${doc}: ₹${rev} (₹${Math.round(rev*0.6)} doctor, ₹${Math.round(rev*0.4)} hospital)</li>`).join('')+'</ul>';
  html += `<h4>Revenue Per Department</h4><ul>`+Object.entries(perDept).map(([dept,rev])=>`<li>${dept}: ₹${rev}</li>`).join('')+'</ul>';
  document.getElementById('hospital-dashboard-data').innerHTML = html;
}
function showDoctorDashboard(){
  let name = document.getElementById('dashboard-doctor-select').value;
  let doc = doctors.find(d=>d.name===name);
  if(!doc) return;
  let myAppts = appointments.filter(a=>a.doctor===doc.name);
  let totalEarn = myAppts.reduce((s,a)=>s+a.fee*0.6,0);
  let totalConsults = myAppts.length;
  // Per-hospital earning
  let byHosp = {};
  for(let h of doc.hospitals){ byHosp[h.hospital]=0; }
  for(let appt of myAppts) { if(byHosp[appt.hospital]!=null) byHosp[appt.hospital]+=appt.fee*0.6; }
  let html = `<div>Total Earnings: <b>₹${totalEarn}</b></div>
    <div>Total Consultations: <b>${totalConsults}</b></div>
    <h4>Earnings by Hospital:</h4><ul>
    ${
      Object.entries(byHosp).map(([h,amt])=>`<li>${h}: ₹${amt.toFixed(0)}</li>`).join('')
    }</ul>`;
  document.getElementById('doctor-dashboard-data').innerHTML = html;
}
function showPatientHistory(){
  let id = document.getElementById('dashboard-patient-select').value;
  let pat = patients.find(p=>p.id===id);
  if(!pat) return;
  let html = "<h4>Consultation Records:</h4>";
  html += pat.history && pat.history.length ?
    `<table><tr><th>Doctor</th><th>Hospital</th><th>Dept</th><th>Date</th><th>From</th><th>To</th><th>Fee</th><th>Paid</th></tr>` +
    pat.history.map(a=>`<tr><td>${a.doctor}</td><td>${a.hospital}</td><td>${a.department}</td><td>${a.date}</td><td>${a.from}</td><td>${a.to}</td><td>₹${a.fee}</td><td>₹${a.amt}</td></tr>`).join('')+'</table>'
    : "<em>No appointments yet.</em>";
  document.getElementById('patient-history-data').innerHTML = html;
}