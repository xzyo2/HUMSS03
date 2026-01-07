// --- Configuration ---
const START_DATE = "2026-01-12"; 
const CLASS_LIST = [
    "Alcantara, Adrian", "Añis, Troy", "Arizobal, Mark", "Armada, Rhyanna", "Belleza, Brent", "Benito, Nasheia", "Bou, Mark", "Bra, John", "Buccat, Cristine", "Cabanilla, Carl", "Caldozo, Zymone", "Calinao, Charleen", "Cardinal, Clarisse", "Clamor, John", "Colango, Chesca", "Collado, Gilby", "Dañas, Princess", "Dawis, Jomel", "De Guzman, Arquin", "Decena, Angelo", "Dela Cruz, Rain", "Dugos, Denise", "Estañol, Jericho", "Estoesta, Lorainne", "Fajutnao, Nikki", "Faminial, Miguel", "Gamel, Exequiel", "Garcia, Clint", "Lavarrete, Djhinlee", "Loyola, Princess", "Macaraan, Johanna", "Maglente, Tifanny", "Malabanan, Vidette", "Mendez, Rosselle", "Montecillo, Jericho", "Paglinawan, Raina", "Panganiban, Kim", "Pascua, Santy", "Perea, Lance", "Quito, Ma. Eraiza", "Reyes, Roseyhellyn", "Rivera, Christine", "Rodriguez, John", "Rosales, Ann", "Tadena, Faye", "Terrible, Gabriel", "Tito, Natalie", "Villanueva, Ford", "Villanueva, Mallory", "Miguel, Hannah"
];

const phrases = ["Best section known to man", "Worst section known to man"];
let phraseIndex = 0, charIndex = 0, isDeleting = false;

// --- Global State ---
let cachedAttendanceData = []; 
let cachedViolationData = [];
let fundsPage = 1;
let currentUserRole = null; 
let sessionPassword = "";

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    typeWriter();

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('viewDate').value = START_DATE; 
    document.getElementById('adminDate').value = START_DATE;
    if(document.getElementById('fundDate')) document.getElementById('fundDate').value = today;

    loadStudentChecklist(); 
    loadViolationDropdown();

    if(window.location.hash === '#attendance') loadAttendance();
    if(window.location.hash === '#funds') loadFunds();
    if(window.location.hash === '#records') loadRecords();
});

// --- Nav ---
function showSection(id) {
    document.querySelectorAll('.page-section').forEach(sec => {
        sec.classList.remove('active-section');
        if(sec.id === 'home') sec.style.display = 'none'; 
    });
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const target = document.getElementById(id);
    if(id === 'home') target.style.display = 'flex';
    target.classList.add('active-section');
    
    const map = { 'home': 0, 'attendance': 1, 'funds': 2, 'records': 3, 'birthdays': 4 };
    const navButtons = document.querySelectorAll('.nav-btn');
    if(navButtons[map[id]]) navButtons[map[id]].classList.add('active');

    if(id === 'attendance') loadAttendance();
    if(id === 'funds') { fundsPage = 1; loadFunds(); }
    if(id === 'records') loadRecords();
}

// ================= ADMIN SYSTEM =================

function toggleAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal.style.display === 'none' || modal.style.display === '') {
        modal.style.display = 'block';
        if (sessionPassword) {
            document.getElementById('loginView').style.display = 'none';
            document.getElementById('logoutView').style.display = 'block';
            document.getElementById('dashboardView').style.display = 'none';
            document.getElementById('fundsDashboardView').style.display = 'none';
            document.getElementById('recordsDashboardView').style.display = 'none';
            document.getElementById('violationHistoryView').style.display = 'none';
        } else {
            document.getElementById('loginView').style.display = 'block';
            document.getElementById('logoutView').style.display = 'none';
            document.getElementById('dashboardView').style.display = 'none';
            document.getElementById('fundsDashboardView').style.display = 'none';
            document.getElementById('recordsDashboardView').style.display = 'none';
            document.getElementById('violationHistoryView').style.display = 'none';
        }
    } else {
        closeAdminModal();
    }
}

function closeAdminModal() { document.getElementById('adminModal').style.display = 'none'; }

function logout() {
    sessionPassword = "";
    currentUserRole = null;
    
    document.body.classList.remove('theme-pink');
    
    const globalBtn = document.getElementById('globalAdminBtn');
    globalBtn.classList.remove('logged-in');
    globalBtn.innerHTML = '<i class="fas fa-lock"></i>';
    
    document.getElementById('attendanceAdminActionBtn').style.display = 'none';
    document.getElementById('fundsAdminActionBtn').style.display = 'none';
    document.getElementById('recordsAdminActionBtn').style.display = 'none';
    
    closeAdminModal();
    showToast("Logged out successfully", "success");

    const hash = window.location.hash || '#home';
    if(hash === '#funds') { fundsPage = 1; loadFunds(); }
    if(hash === '#records') loadRecords(); 
}

async function verifyAdmin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    const err = document.getElementById('loginError');
    const btn = document.querySelector('#loginView .action-btn');

    let endpoint = '', role = '';
    
    if (user === 'secretary') { endpoint = '/api/attendance'; role = 'secretary'; }
    else if (user === 'Audit') { endpoint = '/api/funds'; role = 'treasurer'; }
    else if (user === 'Admin') { endpoint = '/api/records'; role = 'admin'; }
    else { err.textContent = "Unknown Username"; return; }

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
            const globalBtn = document.getElementById('globalAdminBtn');
            globalBtn.classList.add('logged-in');
            globalBtn.innerHTML = '<i class="fas fa-unlock"></i>';

            if (role === 'secretary') {
                document.body.classList.add('theme-pink');
                document.getElementById('attendanceAdminActionBtn').style.display = 'block';
            } else if (role === 'treasurer') {
                document.body.classList.remove('theme-pink');
                document.getElementById('fundsAdminActionBtn').style.display = 'block';
                fundsPage = 1; loadFunds(); 
            } else if (role === 'admin') {
                document.body.classList.remove('theme-pink');
                document.getElementById('recordsAdminActionBtn').style.display = 'block';
                loadRecords(); 
            }

            showToast(`Welcome, ${user}`, "success");
            document.getElementById('adminUser').value = '';
            document.getElementById('adminPass').value = '';
        } else {
            err.textContent = "Wrong Password";
        }
    } catch (e) {
        err.textContent = "Connection Error";
    } finally {
        btn.textContent = "Unlock";
    }
}

// ================= RECORDS LOGIC =================

async function loadRecords() {
    const container = document.getElementById('recordsList');
    const filter = document.getElementById('recordSearchBar').value.toLowerCase();
    
    if(container.innerHTML === '') container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Loading records...</div>';

    try {
        const res = await fetch('/api/records');
        const violations = await res.json();
        
        cachedViolationData = violations; 
        
        let studentMap = {};
        CLASS_LIST.forEach(name => { studentMap[name] = 0; });

        violations.forEach(v => {
            if(studentMap.hasOwnProperty(v.student_name)) {
                studentMap[v.student_name]++;
            } else {
                studentMap[v.student_name] = 1;
            }
        });

        let sortedStudents = Object.keys(studentMap).map(name => {
            return { name: name, count: studentMap[name] };
        }).sort((a, b) => b.count - a.count);

        container.innerHTML = '';
        let hasResults = false;

        sortedStudents.forEach(s => {
            if(s.name.toLowerCase().includes(filter)) {
                hasResults = true;
                
                let clickAction = '';
                let cursorStyle = '';
                let hoverTitle = '';
                
                if (currentUserRole === 'admin') {
                    clickAction = `onclick="viewStudentHistory('${s.name}')"`;
                    cursorStyle = 'cursor: pointer;';
                    hoverTitle = 'title="Click to view details"';
                }

                const html = `
                    <div class="record-card" ${clickAction} ${hoverTitle} style="${cursorStyle}">
                        <div class="r-info">
                            <h3>${s.name}</h3>
                            <div class="privacy-text">Due to privacy reasons, reason for violation will not be set public. Message any classroom officer.</div>
                        </div>
                        <div class="violation-badge">Violation: ${s.count}</div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', html);
            }
        });

        if(!hasResults) container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">No student found.</div>';

    } catch (e) {
        container.innerHTML = '<div style="text-align:center; color:var(--danger);">Error loading records.</div>';
    }
}

function openRecordsEditor() {
    document.getElementById('adminModal').style.display = 'block';
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('logoutView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('fundsDashboardView').style.display = 'none';
    document.getElementById('violationHistoryView').style.display = 'none';
    document.getElementById('recordsDashboardView').style.display = 'block';
}

function loadViolationDropdown() {
    const select = document.getElementById('violationStudentSelect');
    if(!select) return;
    select.innerHTML = '';
    CLASS_LIST.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.text = name;
        select.appendChild(option);
    });
}

async function submitViolation() {
    const student = document.getElementById('violationStudentSelect').value;
    const reason = document.getElementById('violationReason').value;

    if(!reason) { showToast("Please enter a reason", "error"); return; }
    
    try {
        const res = await fetch('/api/records', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                action: 'add', 
                student_name: student, 
                reason: reason, 
                password: sessionPassword 
            })
        });

        if(res.ok) {
            showToast("Violation Added", "success");
            document.getElementById('violationReason').value = ''; 
            closeAdminModal();
            loadRecords(); 
        } else {
            showToast("Error or Unauthorized", "error");
        }
    } catch(e) {
        showToast("Server Error", "error");
    }
}

function viewStudentHistory(name) {
    if (currentUserRole !== 'admin') return;

    // Show View
    document.getElementById('adminModal').style.display = 'block';
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('logoutView').style.display = 'none';
    document.getElementById('recordsDashboardView').style.display = 'none';
    document.getElementById('violationHistoryView').style.display = 'block';
    
    document.getElementById('historyStudentName').textContent = name;
    const historyContainer = document.getElementById('historyList');
    historyContainer.innerHTML = '';

    const studentViolations = cachedViolationData.filter(v => v.student_name === name);

    if (studentViolations.length === 0) {
        historyContainer.innerHTML = '<div style="text-align:center; color:#888; padding:20px;">Clean Record. No violations.</div>';
    } else {
        // Sort by newest first
        studentViolations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        studentViolations.forEach(v => {
            const date = new Date(v.created_at).toLocaleString();
            
            // Note: We use a wrapper div (.history-content) for text so the button sits on the right
            const html = `
                <div class="history-item">
                    <div class="history-content">
                        <span class="history-date">${date}</span>
                        <div class="history-reason">${v.violation_reason}</div>
                    </div>
                    <button class="history-delete-btn" onclick="deleteViolation(${v.id}, '${name}')" title="Remove Violation">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            historyContainer.insertAdjacentHTML('beforeend', html);
        });
    }
}

async function deleteViolation(id, studentName) {
    if(!confirm("Are you sure you want to delete this violation log?")) return;

    try {
        const res = await fetch('/api/records', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                action: 'delete', 
                id: id, 
                password: sessionPassword 
            })
        });

        if(res.ok) {
            showToast("Violation removed", "success");
            
            // 1. Refresh Global Data (Updates the counts on main screen)
            await loadRecords();
            
            // 2. Refresh the History View (So the item disappears immediately)
            viewStudentHistory(studentName); 
        } else {
            showToast("Failed to delete", "error");
        }
    } catch(e) {
        showToast("Server Error", "error");
    }
}

// ================= FUNDS LOGIC =================

async function refreshFunds() {
    const icon = document.getElementById('refreshIcon');
    if(icon) icon.classList.add('fa-spin');
    fundsPage = 1; 
    await loadFunds(false); 
    if(icon) icon.classList.remove('fa-spin');
    showToast("Funds updated", "success");
}

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
            
            let deleteBtnHtml = '';
            if (currentUserRole === 'treasurer') {
                deleteBtnHtml = `<button class="t-delete-btn" onclick="deleteFundTransaction(${t.id})" title="Delete"><i class="fas fa-times"></i></button>`;
            }

            const html = `
                <div class="transaction-item">
                    <div class="t-info">
                        <h4>${t.title}</h4>
                        <span>${date}</span>
                    </div>
                    <div style="display:flex; align-items:center;">
                        <div class="t-amount ${colorClass}">${sign} ₱${parseFloat(t.amount).toFixed(2)}</div>
                        ${deleteBtnHtml}
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });

    } catch (e) {
        if(!append) document.getElementById('transactionList').innerHTML = '<div style="text-align:center; padding:20px; color:var(--danger)">Error loading funds.</div>';
    }
}

function openFundsEditor() {
    document.getElementById('adminModal').style.display = 'block';
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('logoutView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('recordsDashboardView').style.display = 'none';
    document.getElementById('violationHistoryView').style.display = 'none';
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
            body: JSON.stringify({ title, amount, type, date, password: sessionPassword })
        });

        if(res.ok) {
            showToast("Transaction Saved", "success");
            closeAdminModal();
            refreshFunds(); 
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

async function deleteFundTransaction(id) {
    if(!confirm("Are you sure you want to delete this transaction?")) return;
    try {
        const res = await fetch('/api/funds', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'delete', id: id, password: sessionPassword })
        });
        if(res.ok) {
            showToast("Transaction deleted", "success");
            refreshFunds(); 
        } else {
            showToast("Failed to delete", "error");
        }
    } catch(e) {
        showToast("Server Error", "error");
    }
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
    document.getElementById('recordsDashboardView').style.display = 'none';
    document.getElementById('violationHistoryView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'block';
    
    loadStudentChecklist(); 
    const viewDate = document.getElementById('viewDate').value;
    if (viewDate) document.getElementById('adminDate').value = viewDate;
    syncCheckboxesWithDate();
}

function syncCheckboxesWithDate() {
    const targetDate = document.getElementById('adminDate').value;
    const checkboxes = document.querySelectorAll('.absent-checkbox');
    checkboxes.forEach(box => box.checked = false);
    if (!targetDate || cachedAttendanceData.length === 0) return;
    const recordsForDate = cachedAttendanceData.filter(rec => rec.date.startsWith(targetDate));
    if (recordsForDate.length > 0) {
        checkboxes.forEach(box => {
            const record = recordsForDate.find(r => r.student_name === box.value);
            if (record && record.status === 'Absent') box.checked = true;
        });
        showToast("Loaded existing records for editing", "success");
    }
}

function loadStudentChecklist() {
    const container = document.getElementById('studentChecklist');
    container.innerHTML = ''; 
    CLASS_LIST.forEach(name => {
        container.insertAdjacentHTML('beforeend', `<div class="checklist-item"><label><input type="checkbox" value="${name}" class="absent-checkbox"> ${name}</label></div>`);
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
        records.push({ name: box.value, date: date, status: box.checked ? 'Absent' : 'Present' });
    });

    try {
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', records: records, password: sessionPassword })
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
    if(!confirm(`Delete ALL records for ${date}?`)) return;

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

// --- Helpers ---
function filterAttendance() {
    const input = document.getElementById('searchBar').value.toLowerCase();
    const rows = document.getElementById('attendanceTableBody').getElementsByTagName('tr');
    for (let row of rows) row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
}
function filterModalNames() {
    const filter = document.getElementById('modalSearch').value.toLowerCase();
    const items = document.getElementsByClassName('checklist-item');
    for (let item of items) item.style.display = item.innerText.toLowerCase().includes(filter) ? "flex" : "none";
}
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = (progress * (end - start) + start).toFixed(2);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
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
    if (!isDeleting && charIndex === currentPhrase.length) { isDeleting = true; typeSpeed = 2000; } 
    else if (isDeleting && charIndex === 0) { isDeleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; typeSpeed = 500; }
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

