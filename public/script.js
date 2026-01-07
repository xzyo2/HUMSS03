// --- Configuration ---
const START_DATE = "2026-01-12"; 
const CLASS_LIST = [
    "Alcantara, Adrian", "Añis, Troy", "Arizobal, Mark", "Armada, Rhyanna", "Belleza, Brent", "Benito, Nasheia", "Bou, Mark", "Bra, John", "Buccat, Cristine", "Cabanilla, Carl", "Caldozo, Zymone", "Calinao, Charleen", "Cardinal, Clarisse", "Clamor, John", "Colango, Chesca", "Collado, Gilby", "Dañas, Princess", "Dawis, Jomel", "De Guzman, Arquin", "Decena, Angelo", "Dela Cruz, Rain", "Dugos, Denise", "Estañol, Jericho", "Estoesta, Lorainne", "Fajutnao, Nikki", "Faminial, Miguel", "Gamel, Exequiel", "Garcia, Clint", "Lavarrete, Djhinlee", "Loyola, Princess", "Macaraan, Johanna", "Maglente, Tifanny", "Malabanan, Vidette", "Mendez, Rosselle", "Montecillo, Jericho", "Paglinawan, Raina", "Panganiban, Kim", "Pascua, Santy", "Perea, Lance", "Quito, Ma. Eraiza", "Reyes, Roseyhellyn", "Rivera, Christine", "Rodriguez, John", "Rosales, Ann", "Tadena, Faye", "Terrible, Gabriel", "Tito, Natalie", "Villanueva, Ford", "Villanueva, Mallory", "Miguel, Hannah"
];

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    // Remove from DOM after animation (3s)
    setTimeout(() => {
        toast.remove();
    }, 3200);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    typeWriter();
    const dateInput = document.getElementById('viewDate');
    const adminDateInput = document.getElementById('adminDate');
    dateInput.value = START_DATE; 
    adminDateInput.value = START_DATE;
    if(window.location.hash === '#attendance') loadAttendance();
});

// --- Navigation ---
function showSection(id) {
    document.querySelectorAll('.page-section').forEach(sec => {
        sec.classList.remove('active-section');
        if(sec.id === 'home') sec.style.display = 'none'; 
    });
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const target = document.getElementById(id);
    if(id === 'home') target.style.display = 'flex';
    target.classList.add('active-section');
    
    const navButtons = document.querySelectorAll('.nav-btn');
    if(id === 'home') navButtons[0].classList.add('active');
    if(id === 'attendance') {
        navButtons[1].classList.add('active');
        loadAttendance();
    }
    if(id === 'funds') navButtons[2].classList.add('active');
    if(id === 'records') navButtons[3].classList.add('active');
    if(id === 'birthdays') navButtons[4].classList.add('active');
}

// --- Typewriter ---
const phrases = ["Best section known to man", "Worst section known to man"];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeWriter() {
    const target = document.querySelector('.typewriter');
    if (!target) return;
    const currentPhrase = phrases[phraseIndex];
    
    if (!isDeleting && charIndex < currentPhrase.length) {
        target.textContent += currentPhrase.charAt(charIndex++);
    } else if (isDeleting && charIndex > 0) {
        target.textContent = currentPhrase.substring(0, --charIndex);
    }
    
    let speed = isDeleting ? 50 : 100;
    if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true; speed = 2000;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false; phraseIndex = (phraseIndex + 1) % phrases.length;
    }
    setTimeout(typeWriter, speed);
}

// --- Attendance Logic ---
function validateSchoolDay(input) {
    const date = new Date(input.value);
    const day = date.getDay(); 
    const warning = document.getElementById('dateWarning');
    if (day === 0 || day > 3) warning.textContent = "Warning: School days are only Mon-Wed.";
    else warning.textContent = "";
}

async function loadAttendance() {
    const tbody = document.getElementById('attendanceTableBody');
    const selectedDate = document.getElementById('viewDate').value;

    if (!selectedDate) return;
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">Loading records...</td></tr>';

    try {
        const res = await fetch('/api/attendance');
        const allRecords = await res.json();
        const dailyRecords = allRecords.filter(rec => rec.date.startsWith(selectedDate));
        
        tbody.innerHTML = '';
        if (dailyRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#888;">No records for this date.</td></tr>';
            return;
        }

        dailyRecords.sort((a, b) => a.student_name.localeCompare(b.student_name));
        dailyRecords.forEach(row => {
            const statusClass = row.status === 'Absent' ? 'status-absent' : 'status-present';
            const statusText = row.status === 'Absent' ? 'Absent' : 'Present';
            tbody.innerHTML += `<tr><td style="font-weight: 500;">${row.student_name}</td><td><span class="status-pill ${statusClass}">${statusText}</span></td></tr>`;
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color: var(--danger);">Connection Error.</td></tr>';
    }
}

function filterAttendance() {
    const input = document.getElementById('searchBar').value.toLowerCase();
    const rows = document.getElementById('attendanceTableBody').getElementsByTagName('tr');
    for (let row of rows) {
        const txt = row.innerText;
        row.style.display = txt.toLowerCase().indexOf(input) > -1 ? "" : "none";
    }
}

// --- Admin System ---
let tempPassword = "";

function openAdminModal() { document.getElementById('adminModal').style.display = 'block'; }
function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
    document.getElementById('loginView').style.display = 'block';
    document.getElementById('dashboardView').style.display = 'none';
    tempPassword = "";
}

async function verifyAdmin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    const err = document.getElementById('loginError');
    const btn = document.querySelector('#loginView .action-btn');

    if (user !== 'secretary') { err.textContent = "Invalid Username"; return; }

    btn.textContent = "Checking...";
    err.textContent = "";

    try {
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', password: pass })
        });

        if (res.ok) {
            tempPassword = pass; 
            document.getElementById('loginView').style.display = 'none';
            document.getElementById('dashboardView').style.display = 'block';
            loadStudentChecklist();
            validateSchoolDay(document.getElementById('adminDate'));
            showToast("Welcome back, Secretary", "success");
        } else {
            err.textContent = "Wrong Password";
        }
    } catch (e) {
        err.textContent = "Connection Error";
    } finally {
        btn.textContent = "Unlock";
    }
}

function loadStudentChecklist() {
    const container = document.getElementById('studentChecklist');
    container.innerHTML = '';
    CLASS_LIST.forEach(name => {
        container.innerHTML += `<div class="checklist-item"><label style="display:flex; align-items:center; width:100%; cursor:pointer;"><input type="checkbox" value="${name}" class="absent-checkbox"> ${name}</label></div>`;
    });
}

function filterModalNames() {
    const filter = document.getElementById('modalSearch').value.toLowerCase();
    const items = document.getElementsByClassName('checklist-item');
    for (let item of items) {
        item.style.display = item.innerText.toLowerCase().includes(filter) ? "flex" : "none";
    }
}

// --- SUBMIT (SAVE/EDIT) ---
async function submitAttendance() {
    const date = document.getElementById('adminDate').value;
    if(!date) { showToast("Please select a date", "error"); return; }

    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.innerText;
    
    // Loading State
    saveBtn.innerHTML = '<i class="fas fa-spinner"></i> Saving...';
    saveBtn.disabled = true;

    const checkboxes = document.querySelectorAll('.absent-checkbox');
    const records = [];
    checkboxes.forEach(box => {
        records.push({
            name: box.value,
            date: date,
            status: box.checked ? 'Absent' : 'Present'
        });
    });

    try {
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'save', // Uses overwrite logic
                records: records, 
                password: tempPassword 
            })
        });

        if (res.ok) {
            showToast("Records saved successfully!", "success");
            closeAdminModal();
            document.getElementById('viewDate').value = date;
            loadAttendance();
        } else {
            showToast("Failed to save records", "error");
        }
    } catch (e) {
        showToast("Server Error", "error");
    } finally {
        // Restore Button
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
}

// --- DELETE FUNCTION ---
async function deleteDateRecords() {
    const date = document.getElementById('adminDate').value;
    if(!date) { showToast("Select a date to delete", "error"); return; }

    if(!confirm(`Are you sure you want to delete ALL records for ${date}?`)) return;

    try {
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'delete', 
                date: date, 
                password: tempPassword 
            })
        });

        if (res.ok) {
            showToast(`Deleted records for ${date}`, "success");
            closeAdminModal();
            loadAttendance();
        } else {
            showToast("Failed to delete", "error");
        }
    } catch (e) {
        showToast("Server Error", "error");
    }
}
