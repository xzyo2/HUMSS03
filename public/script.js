// --- Configuration ---
// School starts Jan 12, 2026. Only Mon-Wed are school days.
const START_DATE = "2026-01-12"; 
const CLASS_LIST = [
    "Alcantara, Adrian", "Añis, Troy", "Arizobal, Mark", "Armada, Rhyanna", "Belleza, Brent", "Benito, Nasheia", "Bou, Mark", "Bra, John", "Buccat, Cristine", "Cabanilla, Carl", "Caldozo, Zymone", "Calinao, Charleen", "Cardinal, Clarisse", "Clamor, John", "Colango, Chesca", "Collado, Gilby", "Dañas, Princess", "Dawis, Jomel", "De Guzman, Arquin", "Decena, Angelo", "Dela Cruz, Rain", "Dugos, Denise", "Estañol, Jericho", "Estoesta, Lorainne", "Fajutnao, Nikki", "Faminial, Miguel", "Gamel, Exequiel", "Garcia, Clint", "Lavarrete, Djhinlee", "Loyola, Princess", "Macaraan, Johanna", "Maglente, Tifanny", "Malabanan, Vidette", "Mendez, Rosselle", "Montecillo, Jericho", "Paglinawan, Raina", "Panganiban, Kim", "Pascua, Santy", "Perea, Lance", "Quito, Ma. Eraiza", "Reyes, Roseyhellyn", "Rivera, Christine", "Rodriguez, John", "Rosales, Ann", "Tadena, Faye", "Terrible, Gabriel", "Tito, Natalie", "Villanueva, Ford", "Villanueva, Mallory", "Miguel, Hannah"
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    typeWriter();
    
    // Set default date to Start Date (Jan 12)
    const dateInput = document.getElementById('viewDate');
    const adminDateInput = document.getElementById('adminDate');
    
    dateInput.value = START_DATE; 
    adminDateInput.value = START_DATE;

    // Load initial data for that date
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
    
    // Find button that triggered this or match by text (simple hack for this structure)
    // In production, better to pass 'this' or use IDs
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

// --- Typewriter (Same as before) ---
const phrases = ["Best section known to man", "Worst section known to man"];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeWriter() {
    const currentPhrase = phrases[phraseIndex];
    const typeSpeed = isDeleting ? 50 : 100;
    const target = document.querySelector('.typewriter');
    if (!target) return;

    if (!isDeleting && charIndex < currentPhrase.length) {
        target.textContent += currentPhrase.charAt(charIndex);
        charIndex++;
    } else if (isDeleting && charIndex > 0) {
        target.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
    }
    if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true; setTimeout(typeWriter, 2000); return;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false; phraseIndex = (phraseIndex + 1) % phrases.length;
    }
    setTimeout(typeWriter, typeSpeed);
}

// --- Attendance Logic ---

function validateSchoolDay(input) {
    const date = new Date(input.value);
    const day = date.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, ...
    const warning = document.getElementById('dateWarning');
    
    // School is Mon(1), Tue(2), Wed(3) only
    if (day === 0 || day > 3) {
        warning.textContent = "Warning: School days are only Mon-Wed.";
    } else {
        warning.textContent = "";
    }
}

async function loadAttendance() {
    const tbody = document.getElementById('attendanceTableBody');
    const datePicker = document.getElementById('viewDate');
    const selectedDate = datePicker.value;

    if (!selectedDate) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Please select a date.</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">Loading records...</td></tr>';

    try {
        const res = await fetch('/api/attendance');
        const allRecords = await res.json();
        
        // Filter Client Side (Simple for small class size)
        // We compare YYYY-MM-DD strings
        const dailyRecords = allRecords.filter(rec => rec.date.startsWith(selectedDate));
        
        tbody.innerHTML = '';
        if (dailyRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#888;">No records for this date.</td></tr>';
            return;
        }

        // Sort by Name
        dailyRecords.sort((a, b) => a.student_name.localeCompare(b.student_name));

        dailyRecords.forEach(row => {
            const statusClass = row.status === 'Absent' ? 'status-absent' : 'status-present';
            const statusText = row.status === 'Absent' ? 'Absent' : 'Present';

            const tr = `<tr>
                <td style="font-weight: 500;">${row.student_name}</td>
                <td><span class="status-pill ${statusClass}">${statusText}</span></td>
            </tr>`;
            tbody.innerHTML += tr;
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color: var(--danger);">Connection Error.</td></tr>';
    }
}

function filterAttendance() {
    const input = document.getElementById('searchBar').value.toLowerCase();
    const rows = document.getElementById('attendanceTableBody').getElementsByTagName('tr');
    
    for (let row of rows) {
        const nameCell = row.getElementsByTagName('td')[0];
        if (nameCell) {
            const txt = nameCell.textContent || nameCell.innerText;
            row.style.display = txt.toLowerCase().indexOf(input) > -1 ? "" : "none";
        }
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

function verifyAdmin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    const err = document.getElementById('loginError');

    if (user === 'secretary' && pass === '000secr_tary111') {
        tempPassword = pass; 
        document.getElementById('loginView').style.display = 'none';
        document.getElementById('dashboardView').style.display = 'block';
        loadStudentChecklist();
        err.textContent = "";
        
        // Validate the default date immediately
        validateSchoolDay(document.getElementById('adminDate'));
    } else {
        err.textContent = "Invalid Credentials";
    }
}

function loadStudentChecklist() {
    const container = document.getElementById('studentChecklist');
    container.innerHTML = '';
    
    CLASS_LIST.forEach(name => {
        const div = document.createElement('div');
        div.className = 'checklist-item';
        div.innerHTML = `
            <label style="display:flex; align-items:center; width:100%; cursor:pointer;">
                <input type="checkbox" value="${name}" class="absent-checkbox">
                ${name}
            </label>
        `;
        container.appendChild(div);
    });
}

function filterModalNames() {
    const filter = document.getElementById('modalSearch').value.toLowerCase();
    const items = document.getElementsByClassName('checklist-item');
    for (let item of items) {
        const label = item.innerText;
        item.style.display = label.toLowerCase().includes(filter) ? "flex" : "none";
    }
}

async function submitAttendance() {
    const date = document.getElementById('adminDate').value;
    if(!date) { alert("Please select a date"); return; }

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
            body: JSON.stringify({ records: records, password: tempPassword })
        });

        if (res.ok) {
            alert('Saved successfully!');
            closeAdminModal();
            // Update view date to match what we just saved so we can see it
            document.getElementById('viewDate').value = date;
            loadAttendance(); 
        } else {
            alert('Failed to save.');
        }
    } catch (e) {
        console.error(e);
        alert('Error saving data');
    }
}