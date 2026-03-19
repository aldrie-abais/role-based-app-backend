let currentUser = null;

function navigateTo(hash) {
    window.location.hash = hash; // Updates the URL hash (e.g., changes it to #/login)
}

function handleRouting() {
    // 1. Read the current hash, or default to '#/' if it's empty
    let currentHash = window.location.hash;
    if (!currentHash) {
        currentHash = '#/';
        window.location.hash = currentHash; // Set hash to #/ if empty on page load
    }

    if (currentHash === '#/logout') {
        // 1. Clear auth_token from localStorage
        localStorage.removeItem('auth_token');
        
        // 2. Call setAuthState(false)
        setAuthState(false);
        
        // 3. Navigate to home
        navigateTo('#/');
        
        return; // Exit the function early so it doesn't try to find a "logout-page"
    }

    // 2. Hide all page elements
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
        page.classList.remove('active');
    });

    // 3. Show the matching page
    // Convert the hash (e.g., '#/login') to match your section IDs ('login-page')
    let targetId = currentHash === '#/' ? 'home-page' : currentHash.replace('#/', '') + '-page';
    
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');

            if (targetId === 'verify-email-page') {
            const pendingEmail = localStorage.getItem('unverified_email');
            if (pendingEmail) {
                document.getElementById('verify-email-msg').innerHTML = `✅ A verification link has been sent to <strong>${pendingEmail}</strong>`;
            }
        }

        // ////phase 5
        // if (targetId === 'profile-page') {
        //     renderProfile();
        // }

        // ////phase 6B
        // if (targetId === 'departments-page') {
        //     renderDepartmentsTable();
        // }

        // ////phase 6A
        // if (targetId === 'accounts-page') {
        //     renderAccountsTable();
        // }
        // ////phase 6C
        // if (targetId === 'employees-page') {
        //     renderEmployeesTable();
        // }

        // Final Challenge: Router Object mapping routes to functions
        const routeRenderers = {
            'profile-page': renderProfile,
            'departments-page': renderDepartmentsTable,
            'accounts-page': renderAccountsTable,
            'employees-page': renderEmployeesTable,
            'requests-page': renderRequestsTable
        };

        // If the targetId exists in our object, run its attached function!
        if (routeRenderers[targetId]) {
            routeRenderers[targetId]();
        }

    } else {
        // Fallback just in case they type a URL that doesn't exist
        document.getElementById('home-page').classList.add('active'); 
    }
    
    console.log("Navigating to:", currentHash); // Just to test that it's working!
}

// 4. Add the event listener to call handleRouting() whenever the hash changes
window.addEventListener('hashchange', handleRouting);

// 5. Run it once immediately when the page first loads
handleRouting();

// This acts as your boolean toggle
function setAuthState(isAuth, user) {

    currentUser = isAuth ? user : null;

    if (isAuth) {
        // User is logged in
        document.body.classList.remove('not-authenticated');
        document.body.classList.add('authenticated');
        
        // If they are an admin, show admin links
        if (user && user.role === 'Admin') {
            document.body.classList.add('is-admin');
        }
        
        document.getElementById('navbar-user-name').textContent = user.firstName + ' ' + user.lastName;
    } else {
        // User is logged out
        document.body.classList.remove('authenticated');
        document.body.classList.remove('is-admin');
        document.body.classList.add('not-authenticated');
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Phase 3A: Registration

// Safety setup: Initialize a temporary database object if it doesn't exist yet
// if (!window.db) {
//     window.db = { accounts: [] };
// }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Phase 4: Data Persistence with localStorage
const STORAGE_KEY = 'ipt_demo_v1'; // 

function loadFromStorage() { //
    const storedData = localStorage.getItem(STORAGE_KEY);
    
    if (storedData) {
        try {
            window.db = JSON.parse(storedData); // [cite: 232]
        } catch (e) {
            console.error("Corrupt data found. Resetting database.");
            seedDatabase(); // [cite: 233]
        }
    } else {
        seedDatabase(); // [cite: 233]
    }
}

function seedDatabase() {
    window.db = {
        accounts: [
            { // 
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'Password123!',
                role: 'Admin',
                verified: true
            }
        ],
        departments: [ // [cite: 235]
            { name: 'Engineering', description: 'Software team' },
            { name: 'HR', description: 'Human Resources' }
        ],
        employees: [],
        requests: []
    };
    saveToStorage();
}

function saveToStorage() { // 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// Call loadFromStorage() on init to load the database 
loadFromStorage();

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

document.getElementById('reg-submit-btn').addEventListener('click', function() {
    // Get the values from the form
    const firstName = document.getElementById('reg-firstname').value.trim();
    const lastName = document.getElementById('reg-lastname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    // Check password length requirement
    if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'danger');
        return;
    }

    if (!firstName || !lastName || !email) {
        showToast('Please fill in all fields.', 'danger');
        return;
    }

    // Check if email already exists
    const emailExists = window.db.accounts.find(acc => acc.email === email);
    if (emailExists) {
        showToast('This email is already registered.', 'danger');
        return;
    }

    // Save new account with verified: false
    const newAccount = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        role: 'User', // Default role
        verified: false
    };
    
    window.db.accounts.push(newAccount);

    // Store unverified email in localStorage
    localStorage.setItem('unverified_email', email);

    // Navigate to verification page
    navigateTo('#/verify-email');
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Phase 3B: Email Verification (Simulated)
document.getElementById('simulate-verify-btn').addEventListener('click', function() {
    // 1. Find account by unverified_email
    const unverifiedEmail = localStorage.getItem('unverified_email');
    
    // Safety check to make sure the database and accounts array exist (set up fully in Phase 4)
    if (unverifiedEmail && window.db && window.db.accounts) {
        const account = window.db.accounts.find(acc => acc.email === unverifiedEmail);
        
        if (account) {
            // 2. Set verified to true
            account.verified = true;
            
            // 3. Save to storage
            localStorage.setItem('ipt_demo_v1', JSON.stringify(window.db));
            
            // Clean up the temporary email storage
            localStorage.removeItem('unverified_email');
            
            showToast('Email verified! You may now log in.','success');
            
            // 4. Navigate to login
            navigateTo('#/login');
        }
    } else {
        showToast('No unverified account found in storage. Please register first.', 'warning');
    }
});

// Optional: Hook up the "Go to Login" cancel button just in case
document.getElementById('go-to-login-btn').addEventListener('click', function() {
    navigateTo('#/login');
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Phase 3C: Login System
document.getElementById('login-submit-btn').addEventListener('click', function() {
    // 1. Get the form values
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    // Temporary fetch from localStorage (Full persistence is built in Phase 4)
    const storedDB = JSON.parse(localStorage.getItem('ipt_demo_v1'));
    const accounts = storedDB ? storedDB.accounts : (window.db ? window.db.accounts : []);

    // 2. Find account with matching email, password, and verified: true
    const account = accounts.find(acc => acc.email === email && acc.password === password && acc.verified === true);

    if (account) {
        // 3. Save auth_token in localStorage
        localStorage.setItem('auth_token', email);
        
        // 4. Update the UI state
        setAuthState(true, account);
        
        // 5. Navigate to profile
        navigateTo('#/profile');
    } else {
        // 6. Else: show error
        showToast('Invalid email, password, or account is not verified.', 'danger');
    }
});

// Hook up the Cancel button to return home
document.getElementById('login-cancel-btn').addEventListener('click', function() {
    navigateTo('#/');
});

// Phase 5: Profile Page
function renderProfile() {
    // Safety check to ensure someone is actually logged in
    if (!currentUser) return; 

    // Update the DOM with the current user's details
    document.getElementById('profile-name').textContent = currentUser.firstName + ' ' + currentUser.lastName;
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-role').textContent = currentUser.role;
}

// Attach the alert to the Edit Profile button
document.getElementById('profile-edit-btn').addEventListener('click', function() {
    showToast('Edit Profile functionality coming soon!', 'info');
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Phase 6A: Accounts (Part 1 - Render, Reset, Delete)
function renderAccountsTable() {
    const listContainer = document.getElementById('accounts-list');
    listContainer.innerHTML = ''; 
    
    // Loop through the database and create a row for each account [cite: 248]
    window.db.accounts.forEach(acc => {
        const row = document.createElement('div');
        row.className = 'row row-cols-5 ms-4 mt-3 me-4 align-items-center text-center';
        
        // Use a ternary operator ( ? : ) to show a checkmark if verified, or an X if not
        row.innerHTML = `
            <div><p class="fs-5"><strong>${acc.firstName} ${acc.lastName}</strong></p></div>
            <div><p class="fs-5"><strong>${acc.email}</strong></p></div>
            <div><p class="fs-5"><strong>${acc.role}</strong></p></div>
            <div><p class="fs-5"><strong>${acc.verified ? '✅' : '❌'}</strong></p></div>
            <div>
                <button data-action="edit" data-email="${acc.email}" class="ms-3 rounded p-2 mb-3" style="border: 3px solid rgb(0, 106, 193); color:rgb(0, 106, 193); background-color: white;"><strong>Edit</strong></button>
                <button data-action="reset" data-email="${acc.email}" class="ms-3 rounded p-2 mb-3" style="border: 3px solid rgb(193, 135, 0); color:rgb(193, 135, 0); background-color: white;"><strong>Reset PW</strong></button>
                <button data-action="delete" data-email="${acc.email}" class="ms-3 rounded p-2 mb-3" style="border: 3px solid rgb(193, 45, 0); color:rgb(193, 45, 0); background-color: white;"><strong>Delete</strong></button>
            </div>
        `;
        listContainer.appendChild(row);
    });
}

    // Final Challenge: Event Delegation for Accounts List
    document.getElementById('accounts-list').addEventListener('click', function(e) {
        // Check if what we clicked is a button (or inside a button)
        const btn = e.target.closest('button');
        if (!btn) return;

        // Read our custom data attributes
        const action = btn.getAttribute('data-action');
        const email = btn.getAttribute('data-email');

        // Route the click to the correct function
        if (action === 'edit') window.editAccount(email);
        if (action === 'reset') window.resetAccountPassword(email);
        if (action === 'delete') window.deleteAccount(email);
    });

// Action: Reset Password [cite: 251]
window.resetAccountPassword = function(email) {
    const newPassword = prompt("Enter new password (min 6 characters):");
    if (newPassword && newPassword.length >= 6) {
        const acc = window.db.accounts.find(a => a.email === email);
        if (acc) {
            acc.password = newPassword;
            saveToStorage();
            showToast("Password updated successfully.", "success");
        }
    } else if (newPassword) {
        showToast("Password must be at least 6 characters.", "danger"   );
    }
};

// Action: Delete Account [cite: 252]
window.deleteAccount = function(email) {
    // Prevent self-deletion [cite: 252]
    if (email === currentUser.email) {
        showToast("You cannot delete your own account.",'danger');
        return;
    }
    // Confirm deletion [cite: 252]
    if (confirm("Are you sure you want to delete this account?")) {
        window.db.accounts = window.db.accounts.filter(acc => acc.email !== email);
        saveToStorage();
        renderAccountsTable(); // Refresh the table
    }
};

// Phase 6A Part 2: Edit and Save Accounts
window.editAccount = function(email) {
    const acc = window.db.accounts.find(a => a.email === email);
    if (acc) {
        // Pre-fill the form with the selected user's data
        document.getElementById('acc-first').value = acc.firstName;
        document.getElementById('acc-last').value = acc.lastName;
        document.getElementById('acc-email').value = acc.email;
        document.getElementById('acc-password').value = acc.password;
        document.getElementById('acc-role').value = acc.role;
        document.getElementById('acc-verified').checked = acc.verified;
        
        // Scroll down to the form
        window.scrollTo(0, document.body.scrollHeight); 
    }
};

document.getElementById('save-account-btn').addEventListener('click', function() {
    const firstName = document.getElementById('acc-first').value.trim();
    const lastName = document.getElementById('acc-last').value.trim();
    const email = document.getElementById('acc-email').value.trim();
    const password = document.getElementById('acc-password').value;
    const role = document.getElementById('acc-role').value.trim() || 'User';
    const verified = document.getElementById('acc-verified').checked;

    if (!firstName || !lastName || !email || !password) {
        return showToast('Please fill all text fields.', 'warning');
    }

    const existingAcc = window.db.accounts.find(a => a.email === email);
    if (existingAcc) {
        // Update existing account
        existingAcc.firstName = firstName;
        existingAcc.lastName = lastName;
        existingAcc.password = password;
        existingAcc.role = role;
        existingAcc.verified = verified;
        showToast('Account updated successfully.', 'success');
    } else {
        // Add new account
        window.db.accounts.push({ firstName, lastName, email, password, role, verified });
        showToast('New account created.', 'success');
    }
    
    saveToStorage();
    renderAccountsTable();
    document.getElementById('cancel-account-btn').click(); // Clear the form
});

// Clear form on Cancel
document.getElementById('cancel-account-btn').addEventListener('click', function() {
    document.getElementById('acc-first').value = '';
    document.getElementById('acc-last').value = '';
    document.getElementById('acc-email').value = '';
    document.getElementById('acc-password').value = '';
    document.getElementById('acc-role').value = '';
    document.getElementById('acc-verified').checked = false;
});


////////////////////////////////////////////////////////////////////////

// Phase 6B: Departments
function renderDepartmentsTable() {
    const listContainer = document.getElementById('departments-list');
    listContainer.innerHTML = ''; // Clear out the container first
    
    // Loop through the database and create a row for each department
    window.db.departments.forEach(dept => {
        const row = document.createElement('div');
        row.className = 'row ms-4 mt-3 me-4 align-items-center text-center';
        row.innerHTML = `
            <div class="col-4"><p class="fs-5"><strong>${dept.name}</strong></p></div>
            <div class="col-4"><p class="fs-5"><strong>${dept.description}</strong></p></div>
            <div class="col-4">
                <button class="ms-3 rounded p-2 mb-3" style="border: 3px solid rgb(0, 106, 193); color:rgb(0, 106, 193); background-color: white;"><strong>Edit</strong></button>
                <button class="ms-3 rounded p-2 mb-3" style="border: 3px solid rgb(193, 45, 0); color:rgb(193, 45, 0); background-color: white;"><strong>Delete</strong></button>
            </div>
        `;
        listContainer.appendChild(row);
    });
}

// Wire up the Add button
document.getElementById('add-dept-btn').addEventListener('click', function() {
    showToast('Not implemented', 'warning');
});

// Phase 6C: Employees
function renderEmployeesTable() {
    const listContainer = document.getElementById('employees-list');
    listContainer.innerHTML = ''; 
    
    // Render the list of employees
    window.db.employees.forEach(emp => {
        const row = document.createElement('div');
        row.className = 'd-flex flex-row justify-content-around ms-4 mt-3 me-4 align-items-center text-center';
        row.innerHTML = `
            <div><p class="fs-5"><strong>${emp.id}</strong></p></div>
            <div><p class="fs-5"><strong>${emp.email}</strong></p></div>
            <div><p class="fs-5"><strong>${emp.position}</strong></p></div>
            <div><p class="fs-5"><strong>${emp.department}</strong></p></div>
            <div><button class="rounded p-2" style="border: 3px solid rgb(193, 45, 0); color:rgb(193, 45, 0); background-color: white;" onclick="deleteEmployee('${emp.id}')"><strong>Delete</strong></button></div>
        `;
        listContainer.appendChild(row);
    });

    // Populate the Department Dropdown
    const deptSelect = document.getElementById('emp-dept');
    deptSelect.innerHTML = '<option value="">Select Department...</option>';
    window.db.departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.name;
        option.textContent = dept.name;
        deptSelect.appendChild(option);
    });
}

// Save Employee
document.getElementById('save-emp-btn').addEventListener('click', function() {
    const id = document.getElementById('emp-id').value.trim();
    const email = document.getElementById('emp-email').value.trim();
    const position = document.getElementById('emp-position').value.trim();
    const department = document.getElementById('emp-dept').value;
    const hireDate = document.getElementById('emp-hire-date').value;

    if (!id || !email || !position || !department || !hireDate) return showToast('Fill all fields.', 'warning');

    // Enforce email matching an existing account
    const accountExists = window.db.accounts.find(acc => acc.email === email);
    if (!accountExists) return showToast('Error: User Email must match an existing account.', 'danger');

    window.db.employees.push({ id, email, position, department, hireDate });
    saveToStorage();
    renderEmployeesTable();
    
    // Clear inputs
    document.querySelectorAll('#employees-page input').forEach(input => input.value = '');
    document.getElementById('emp-dept').value = '';
});

// Delete Employee
window.deleteEmployee = function(id) {
    if (confirm('Delete this employee?')) {
        window.db.employees = window.db.employees.filter(emp => emp.id !== id);
        saveToStorage();
        renderEmployeesTable();
    }
};

////////////////////////////////////////

// Phase 7: User Requests
function renderRequestsTable() {
    const listContainer = document.getElementById('requests-list');
    listContainer.innerHTML = ''; 
    if (!currentUser) return;

    // Filter requests so users only see their own
    const myRequests = window.db.requests.filter(req => req.employeeEmail === currentUser.email);

    if (myRequests.length === 0) {
        listContainer.innerHTML = '<p class="lead fs-5">You have no requests yet.</p>';
        return;
    }

    myRequests.forEach(req => {
        // Assign Bootstrap colors based on status
        let badgeColor = req.status === 'Approved' ? 'bg-success' : req.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark';
        
        const itemsString = req.items.map(i => `${i.qty}x ${i.name}`).join(', ');

        const row = document.createElement('div');
        row.className = 'border p-3 mb-3 rounded shadow-sm';
        row.style.borderColor = 'lightgray';
        row.innerHTML = `
            <p class="fs-4 mb-1"><strong>${req.type}</strong> <span class="badge ${badgeColor} ms-2">${req.status}</span></p>
            <p class="fs-5 mb-1 text-muted">Date: ${req.date}</p>
            <p class="fs-5 mb-0">Items: ${itemsString}</p>
        `;
        listContainer.appendChild(row);
    });
}

// Add dynamic item row
document.getElementById('add-item-btn').addEventListener('click', function() {
    const container = document.getElementById('req-items-container');
    const newRow = document.createElement('div');
    newRow.className = 'row g-2 align-items-center text-center req-item-row mb-2';
    newRow.innerHTML = `
        <div class="ms-3 col-6"><input type="text" class="form-control p-3 item-name fs-5" placeholder="Item Name"></div>    
        <div class="col-3"><input type="number" class="form-control p-3 item-qty fs-5" placeholder="Qty" value="1"></div>   
        <div class="col-2"><button type="button" class="btn btn-danger remove-item-btn fs-5 p-2 w-100">X</button></div>
    `;
    container.appendChild(newRow);
});

// Remove item row (Using Event Delegation)
document.getElementById('req-items-container').addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-item-btn')) {
        e.target.closest('.req-item-row').remove();
    }
});

// Submit Request
document.getElementById('submit-request-btn').addEventListener('click', function(e) {
    const type = document.getElementById('req-type').value;
    const itemRows = document.querySelectorAll('.req-item-row');
    const items = [];

    // Loop through all dynamic rows and grab the data
    itemRows.forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const qty = row.querySelector('.item-qty').value;
        if (name) items.push({ name, qty });
    });

    // Validation: Must have at least 1 item
    if (items.length === 0) {
        showToast('Validation Error: You must include at least one item.', 'danger');
        return; 
    }

    // Save the request
    const newRequest = {
        type: type,
        items: items,
        status: "Pending",
        date: new Date().toLocaleDateString(),
        employeeEmail: currentUser.email
    };

    window.db.requests.push(newRequest);
    saveToStorage();
    renderRequestsTable();
    
    // Reset the modal inputs for next time
    document.querySelectorAll('.item-name').forEach(input => input.value = '');
    document.querySelectorAll('.item-qty').forEach(input => input.value = '1');

    
});

///////////////////////////////////////////////////////////////////////////////////////////

// Phase 8: UX Polish - Toast Notifications
function showToast(message, type = 'success') {
const toastEl = document.getElementById('app-toast');
const toastMessage = document.getElementById('toast-message');

// 1. Set the text
toastMessage.textContent = message;

// 2. Reset the background color
toastEl.className = 'toast align-items-center text-white border-0';

// 3. Apply the right Bootstrap color class
if (type === 'success') toastEl.classList.add('bg-success');
if (type === 'danger') toastEl.classList.add('bg-danger');
if (type === 'warning') toastEl.classList.add('bg-warning', 'text-dark');
if (type === 'info') toastEl.classList.add('bg-info', 'text-dark');

// 4. Trigger the toast using Bootstrap's JS API
const toast = new bootstrap.Toast(toastEl);
toast.show();
}