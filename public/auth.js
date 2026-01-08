
let currentUserRole = null; 
let sessionPassword = "";

function toggleAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal.style.display === 'none' || modal.style.display === '') {
        modal.style.display = 'block';
        if (sessionPassword) {
            // Logged In View
            document.getElementById('loginView').style.display = 'none';
            document.getElementById('logoutView').style.display = 'block';
            hideAllDashboards();
        } else {
            // Logged Out View
            document.getElementById('loginView').style.display = 'block';
            document.getElementById('logoutView').style.display = 'none';
            hideAllDashboards();
        }
    } else {
        closeAdminModal();
    }
}

function hideAllDashboards() {
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('fundsDashboardView').style.display = 'none';
    document.getElementById('recordsDashboardView').style.display = 'none';
    document.getElementById('violationHistoryView').style.display = 'none';
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
    else if (user === 'Corrupt') { endpoint = '/api/records'; role = 'operator'; } // Operator Route
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

            // --- ROLE BASED UI ---
            if (role === 'secretary') {
                document.body.classList.add('theme-pink');
                document.getElementById('attendanceAdminActionBtn').style.display = 'block';
            } 
            else if (role === 'treasurer') {
                document.body.classList.remove('theme-pink');
                document.getElementById('fundsAdminActionBtn').style.display = 'block';
                fundsPage = 1; loadFunds(); 
            } 
            else if (role === 'admin') {
                document.body.classList.remove('theme-pink');
                document.getElementById('recordsAdminActionBtn').style.display = 'block';
                loadRecords(); 
            }
            else if (role === 'operator') {
                document.body.classList.remove('theme-pink');
                document.getElementById('attendanceAdminActionBtn').style.display = 'block';
                document.getElementById('fundsAdminActionBtn').style.display = 'block';
                document.getElementById('recordsAdminActionBtn').style.display = 'block';
                
                fundsPage = 1; loadFunds();
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
