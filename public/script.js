// --- Configuration ---
const START_DATE = "2026-01-12"; 
const CLASS_LIST = [
    "Alcantara, Adrian", "Añis, Troy", "Arizobal, Mark", "Armada, Rhyanna", "Belleza, Brent", "Benito, Nasheia", "Bou, Mark", "Bra, John", "Buccat, Cristine", "Cabanilla, Carl", "Caldozo, Zymone", "Calinao, Charleen", "Cardinal, Clarisse", "Clamor, John", "Colango, Chesca", "Collado, Gilby", "Dañas, Princess", "Dawis, Jomel", "De Guzman, Arquin", "Decena, Angelo", "Dela Cruz, Rain", "Dugos, Denise", "Estañol, Jericho", "Estoesta, Lorainne", "Fajutnao, Nikki", "Faminial, Miguel", "Gamel, Exequiel", "Garcia, Clint", "Lavarrete, Djhinlee", "Loyola, Princess", "Macaraan, Johanna", "Maglente, Tifanny", "Malabanan, Vidette", "Mendez, Rosselle", "Montecillo, Jericho", "Paglinawan, Raina", "Panganiban, Kim", "Pascua, Santy", "Perea, Lance", "Quito, Ma. Eraiza", "Reyes, Roseyhellyn", "Rivera, Christine", "Rodriguez, John", "Rosales, Ann", "Tadena, Faye", "Terrible, Gabriel", "Tito, Natalie", "Villanueva, Ford", "Villanueva, Mallory", "Miguel, Hannah"
];

// --- Typewriter Configuration ---
const phrases = ["Best section known to man", "Worst section known to man"];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

// --- Global State ---
let cachedAttendanceData = []; 
let fundsPage = 1;
let currentUserRole = null; // 'secretary' or 'treasurer'
let sessionPassword = "";

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Start Typewriter
    typeWriter();

    // 2. Set Default Dates
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('viewDate');
    const adminDateInput = document.getElementById('adminDate');
    const fundDateInput = document.getElementById('fundDate');
    
    dateInput.value = START_DATE; 
    adminDateInput.value = START_DATE;
    if(fundDateInput) fundDateInput.value = today;

    // 3. Load Data based on current URL hash
    if(window.location.hash === '#attendance') loadAttendance();
    if(window.location.hash === '#funds') loadFunds();
    
    // 4. Pre-load checklist
    loadStudentChecklist(); 
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
    
    // Set Active Button
    const navButtons = document.querySelectorAll('.nav-btn');
    if(id === 'home') navButtons[0].classList.add('active');
    if(id === 'attendance') {
        navButtons[1].classList.add('active');
        loadAttendance();
    }
    if(id === 'funds') {
        navButtons[2].classList.add('active');
        fundsPage = 1;
        loadFunds();
    }
    if(id === 'records') navButtons[3].classList.add('active');
    if(id === 'birthdays') navButtons[4].classList.add('active');
}

// ================= ADMIN SYSTEM (MULTI-ROLE) =================

function toggleAdminModal() {
    const modal = document.getElementById('adminModal');
    
    // Check if modal is currently closed
    if (modal.style.display === 'none' || modal.style.display === '') {
        modal.style.display = 'block';
        
        if (sessionPassword) {
            // IF LOGGED IN: Show Logout View
            document.getElementById('loginView').style.display = 'none';
            document.getElementById('logoutView').style.display = 'block';
            document.getElementById('dashboardView').style.display = 'none';
            document.getElementById('fundsDashboardView').style.display = 'none';
        } else {
            // IF LOGGED OUT: Show Login View
            document.getElementById('loginView').style.display = 'block';
            document.getElementById('logoutView').style.display = 'none';
            document.getElementById('dashboardView').style.display = 'none';
            document.getElementById('fundsDashboardView').style.display = 'none';
        }
    } else {
        closeAdminModal();
    }
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

// ... (Previous parts of script.js remain the same) ...

function logout() {
    sessionPassword = "";
    currentUserRole = null;
    
    // 1. Reset Theme to Default (Blue)
    document.body.classList.remove('theme-pink');
    
    // 2. Reset UI Indicators
    const globalBtn = document.getElementById('globalAdminBtn');
    globalBtn.classList.remove('logged-in');
    globalBtn.innerHTML = '<i class="fas fa-lock"></i>';
    
    // 3. Hide all admin buttons
    document.getElementById('attendanceAdminActionBtn').style.display = 'none';
    document.getElementById('fundsAdminActionBtn').style.display = 'none';
    
    closeAdminModal();
    showToast("Logged out successfully", "success");
}

async function verifyAdmin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    const err = document.getElementById('loginError');
    const btn = document.querySelector('#loginView .action-btn');

    let endpoint = '';
    let role = '';
    
    // Determine Role
    if (user === 'secretary') { 
        endpoint = '/api/attendance'; 
        role = 'secretary'; 
    } else if (user === 'Audit') { 
        endpoint = '/api/funds'; 
        role = 'treasurer'; 
    } else { 
        err.textContent = "Unknown Username"; 
        return; 
    }

    btn.textContent = "Checking...";
    err.textContent = "";

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'login', password: pass })
        });

        if (res.ok) {
            sessionPassword = pass;
            currentUserRole = role;
            
            closeAdminModal();
            
            // UI Updates
            const globalBtn = document.getElementById('globalAdminBtn');
            globalBtn.classList.add('logged-in');
            globalBtn.innerHTML = '<i class="fas fa-unlock"></i>';

            // THEME LOGIC:
            // If Secretary -> Pink Theme
            // If Treasurer -> Default Blue (Remove Pink if present)
            if (role === 'secretary') {
                document.body.classList.add('theme-pink');
                document.getElementById('attendanceAdminActionBtn').style.display = 'block';
            } else if (role === 'treasurer') {
                document.body.classList.remove('theme-pink');
                document.getElementById('fundsAdminActionBtn').style.display = 'block';
            }

            showToast(`Welcome, ${user}`, "success");
            
            document.getElementById('adminUser').value = '';
            document.getElementById('adminPass').value = '';
        } else {
            err.textContent = "Wrong Password";
        }
    } catch (e) {
        console.error(e);
        err.textContent = "Connection Error";
    } finally {
        btn.textContent = "Unlock";
    }
}

// ================= FUNDS LOGIC =================

async function loadFunds(append = false) {
    if(!append) {
        document.getElementById('transactionList').innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Loading...</div>';
        fundsPage = 1;
    } else {
        fundsPage++;
    }

    try {
        const res = await fetch(`/api/funds?page=${fundsPage}`);
        const data = await res.json();
        
        // 1. Animate Total Balance (Only on first load)
        if(!append) animateValue("totalFunds", 0, parseFloat(data.total), 1500);

        const container = document.getElementById('transactionList');
        if(!append) container.innerHTML = '';

        if(data.transactions.length === 0 && !append) {
            container.innerHTML = '<div style="text-align:center; padding:20px;">No transactions yet.</div>';
            document.getElementById('loadMoreFundsBtn').style.display = 'none';
            return;
        }

        if(data.transactions.length < 15) document.getElementById('loadMoreFundsBtn').style.display = 'none';
        else document.getElementById('loadMoreFundsBtn').style.display = 'block';

        data.transactions.forEach(t => {
            const date = new Date(t.date).toLocaleDateString();
            const sign = t.type === 'income' ? '+' : '-';
            const colorClass = t.type === 'income' ? 'income' : 'expense';
            
            const html = `
                <div class="transaction-item">
                    <div class="t-info">
                        <h4>${t.title}</h4>
                        <span>${date}</span>
                    </div>
                    <div class="t-amount ${colorClass}">${sign} ₱${parseFloat(t.amount).toFixed(2)}</div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });

    } catch (e) {
        console.error(e);
        if(!append) document.getElementById('transactionList').innerHTML = '<div style="text-align:center; padding:20px; color:var(--danger)">Error loading funds.</div>';
    }
}

function openFundsEditor() {
    document.getElementById('adminModal').style.display = 'block';
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('logoutView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('fundsDashboardView').style.display = 'block';
}

async function submitTransaction() {
    const title = document.getElementById('fundTitle').value;
    const amount = document.getElementById('fundAmount').value;
    const type = document.getElementById('fundType').value;
    const date = document.getElementById('fundDate').value;

    if(!title || !amount) { showToast("Please fill all fields", "error"); return; }

    const btn = document.getElementById('saveFundBtn');
    btn.textContent = "Saving...";

    try {
        const res = await fetch('/api/funds', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                title, amount, type, date,
                password: sessionPassword
            })
        });

        if(res.ok) {
            showToast("Transaction Saved", "success");
            closeAdminModal();
            
            // "Live" Update
            fundsPage = 1;
            loadFunds(false); 
            
            // Clear inputs
            document.getElementById('fundTitle').value = '';
            document.getElementById('fundAmount').value = '';
        } else {
            showToast("Unauthorized or Error", "error");
        }
    } catch(e) {
        showToast("Server Error", "error");
    } finally {
        btn.textContent = "Save Transaction";
    }
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = (progress * (end - start) + start).toFixed(2);
        obj.innerHTML = currentVal;
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// ================= ATTENDANCE LOGIC =================

async function loadAttendance() {
    const tbody = document.getElementById('attendanceTableBody');
    const selectedDate = document.getElementById('viewDate').value;
    if (!selectedDate) return;

    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">Loading records...</td></tr>';

    try {
        const res = await fetch('/api/attendance');
        cachedAttendanceData = await res.json(); 
        
        const dailyRecords = cachedAttendanceData.filter(rec => rec.date.startsWith(selectedDate));
        
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

function openAttendanceEditor() {
    const modal = document.getElementById('adminModal');
    modal.style.display = 'block';
    
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('logoutView').style.display = 'none';
    document.getElementById('fundsDashboardView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'block';
    
    // Force reload checklist
    loadStudentChecklist();

    const viewDate = document.getElementById('viewDate').value;
    const adminDateInput = document.getElementById('adminDate');
    
    if (viewDate) {
        adminDateInput.value = viewDate;
    }
    
    syncCheckboxesWithDate();
    validateSchoolDay(adminDateInput);
}

function syncCheckboxesWithDate() {
    const targetDate = document.getElementById('adminDate').value;
    validateSchoolDay(document.getElementById('adminDate'));
    
    const checkboxes = document.querySelectorAll('.absent-checkbox');
    checkboxes.forEach(box => box.checked = false);

    if (!targetDate || cachedAttendanceData.length === 0) return;

    const recordsForDate = cachedAttendanceData.filter(rec => rec.date.startsWith(targetDate));

    if (recordsForDate.length > 0) {
        checkboxes.forEach(box => {
            const studentName = box.value;
            const record = recordsForDate.find(r => r.student_name === studentName);
            if (record && record.status === 'Absent') {
                box.checked = true;
            }
        });
        showToast("Loaded existing records for editing", "success");
    }
}

function loadStudentChecklist() {
    const container = document.getElementById('studentChecklist');
    container.innerHTML = ''; 
    CLASS_LIST.forEach(name => {
        const itemHtml = `<div class="checklist-item"><label><input type="checkbox" value="${name}" class="absent-checkbox"> ${name}</label></div>`;
        container.insertAdjacentHTML('beforeend', itemHtml);
    });
}

async function submitAttendance() {
    const date = document.getElementById('adminDate').value;
    if(!date) { showToast("Please select a date", "error"); return; }
    
    const saveBtn = document.getElementById('saveBtn');
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
                action: 'save', 
                records: records, 
                password: sessionPassword 
            })
        });

        if (res.ok) {
            showToast("Records saved successfully!", "success");
            closeAdminModal();
            document.getElementById('viewDate').value = date;
            loadAttendance(); 
        } else {
            showToast("Failed to save", "error");
        }
    } catch (e) {
        showToast("Server Error", "error");
    } finally {
        saveBtn.innerText = "Save Records";
        saveBtn.disabled = false;
    }
}

async function deleteDateRecords() {
    const date = document.getElementById('adminDate').value;
    if(!date) { showToast("Select a date to delete", "error"); return; }

    if(!confirm(`Are you sure you want to delete ALL records for ${date}?`)) return;

    try {
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', date: date, password: sessionPassword })
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

// --- Helper Functions ---
function validateSchoolDay(input) {
    const date = new Date(input.value);
    const day = date.getDay(); 
    // School is usually Mon(1) to Fri(5), but user prompt implied Mon-Wed warnings?
    // Keeping logic mostly standard for now.
    // const warning = document.getElementById('dateWarning');
    // if (day === 0 || day > 5) warning.textContent = "Weekend Selected";
    // else warning.textContent = "";
}

function filterAttendance() {
    const input = document.getElementById('searchBar').value.toLowerCase();
    const rows = document.getElementById('attendanceTableBody').getElementsByTagName('tr');
    for (let row of rows) {
        const txt = row.innerText;
        row.style.display = txt.toLowerCase().indexOf(input) > -1 ? "" : "none";
    }
}
function filterModalNames() {
    const filter = document.getElementById('modalSearch').value.toLowerCase();
    const items = document.getElementsByClassName('checklist-item');
    for (let item of items) {
        item.style.display = item.innerText.toLowerCase().includes(filter) ? "flex" : "none";
    }
}

function typeWriter() {
    const target = document.querySelector('.typewriter');
    if (!target) return;

    const currentPhrase = phrases[phraseIndex];
    let typeSpeed = 100;

    if (isDeleting) {
        target.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 50;
    } else {
        target.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        typeSpeed = 2000;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 500;
    }

    setTimeout(typeWriter, typeSpeed);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3200);
}

