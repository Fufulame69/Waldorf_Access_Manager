// Data Structure
let data = {
  departments: [],
  systems: [],
  categories: [],
  accessMatrix: {}
};

let currentUser = null;
let currentDepartment = null;
let currentPosition = null;

// Load data from Firebase
async function loadData() {
  try {
    data = await window.electronAPI.loadData();
    console.log('Data loaded from Firebase:', data);
  } catch (error) {
    console.error('Error loading data from Firebase:', error);
    // Initialize with empty data if Firebase cannot be reached
    data = {
      metadata: {
        version: "1.0.0",
        lastModified: new Date().toISOString(),
        description: "Hotel Access Matrix Management Data"
      },
      departments: [],
      systems: [],
      categories: [],
      accessMatrix: {}
    };
  }
}

// Save data to Firebase
async function saveData() {k
  try {
    // Update the last modified timestamp
    data.metadata.lastModified = new Date().toISOString();
    
    // Save to Firebase via Electron main process
    const result = await window.electronAPI.saveData(data);
    
    if (result.success) {
      console.log('Data saved to Firebase successfully');
      showSaveIndicator();
    } else {
      throw new Error(result.error || 'Unknown error occurred');
    }
  } catch (error) {
    console.error('Error saving data to Firebase:', error);
    alert('Error saving data: ' + error.message);
  }
}

function hasPermission(action) {
    if (!currentUser) return false;

    const rolePermissions = {
        admin: ['manageDepartments', 'managePositions', 'manageSystems', 'manageCategories', 'manageUsers', 'generateForms', 'viewConfigurations'],
        editor: ['manageDepartments', 'managePositions', 'manageSystems', 'generateForms'],
        approver: ['generateForms'],
        viewer: []
    };

    return rolePermissions[currentUser.role]?.includes(action);
}

function showSaveIndicator() {
  const indicator = document.getElementById('saveIndicator');
  indicator.classList.add('show');
  setTimeout(() => {
    indicator.classList.remove('show');
  }, 2000);
}

// Tab Management
function switchTab(tab) {
  // Use querySelectorAll from the .sidebar-nav context
  document.querySelectorAll('.sidebar-nav .tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  // event.target will be the button clicked
  if (event && event.target) {
    event.target.classList.add('active');
  } else {
    // Fallback for direct calls if event is not passed
    const targetTab = Array.from(document.querySelectorAll('.sidebar-nav .tab')).find(t => t.onclick.toString().includes(`switchTab('${tab}')`));
    if (targetTab) {
      targetTab.classList.add('active');
    }
  }
  
  document.getElementById(tab).classList.add('active');
  
  // Show/hide the add department button and action bar
  const addDepartmentBtn = document.getElementById('addDepartmentBtn');
  const actionBar = document.querySelector('#departments .action-bar');
  if (tab === 'departments') {
    // Only show the button when switching to departments tab
    // The individual view functions (showDepartments, showPositions, showAccess) will handle visibility
    actionBar.style.display = 'flex';
  } else {
    addDepartmentBtn.style.display = 'none';
    actionBar.style.display = 'none';
  }
  
  if (tab === 'systems') {
    renderSystemsView();
  } else if (tab === 'formGenerator') { // ADDED
    renderFormGenerator();
  } else if (tab === 'configuration') { // ADDED
    renderConfiguration();
  } else if (tab === 'users') {
    renderUserManagement();
  } else if (tab === 'departments') { // UPDATED
    // When switching back to departments, reset to the top level
    showDepartments();
  }
  
  // Update translations after switching tabs
  translationService.updateUI();
}

// Department View
function showDepartments() {
  currentDepartment = null;
  currentPosition = null;
  document.getElementById('departmentView').style.display = 'block';
  document.getElementById('positionView').style.display = 'none';
  document.getElementById('accessView').style.display = 'none';
  
  // Show the add department button only when viewing departments
  document.getElementById('addDepartmentBtn').style.display = hasPermission('manageDepartments') ? 'block' : 'none';
  
  updateBreadcrumb(['Departments']);
  renderDepartments();
  // Update translations after rendering
  translationService.updateUI();
}

function renderDepartments() {
  const container = document.getElementById('departmentView');
  
  if (data.departments.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Departments Yet</h3>
        <p>Click "Add Department" to get started</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="dept-grid">
      ${data.departments.map(dept => `
        <div class="dept-card" onclick="showPositions(${dept.id})">
          ${hasPermission('manageDepartments') ? `
          <div class="dept-actions" onclick="event.stopPropagation()">
            <button class="icon-btn" onclick="editDepartment(${dept.id})" title="${t('edit')}">✏️</button>
            <button class="icon-btn" onclick="deleteDepartment(${dept.id})" title="${t('delete')}">🗑️</button>
          </div>
          ` : ''}
          <h3>${dept.name}</h3>
          <p>${dept.positions ? dept.positions.length : 0} ${t('positions')}</p>
        </div>
      `).join('')}
    </div>
  `;
}

// Position View
function showPositions(deptId) {
  currentDepartment = data.departments.find(d => d.id === deptId);
  if (!currentDepartment) return;

  document.getElementById('departmentView').style.display = 'none';
  document.getElementById('positionView').style.display = 'block';
  document.getElementById('accessView').style.display = 'none';
  
  // Hide the add department button when viewing positions
  document.getElementById('addDepartmentBtn').style.display = 'none';

  updateBreadcrumb(['Departments', currentDepartment.name]);
  renderPositions();
  // Update translations after rendering
  translationService.updateUI();
}

function renderPositions() {
  const container = document.getElementById('positionView');
  const positions = currentDepartment.positions || [];

  container.innerHTML = `
    <div class="action-bar">
      <h2>${t('departmentPositions', { departmentName: currentDepartment.name })}</h2>
      ${hasPermission('managePositions') ? `<button class="btn btn-primary" onclick="openModal('addPosition')">${t('addPosition')}</button>` : ''}
    </div>
    ${positions.length === 0 ? `
      <div class="empty-state">
        <h3>${t('noPositionsYet')}</h3>
        <p>${t('clickAddPositionToStart')}</p>
      </div>
    ` : `
      <div class="position-list">
        ${positions.map(pos => `
          <div class="position-item" onclick="showAccess(${pos.id})">
            <div class="position-header">
              <span class="position-name">${pos.name}</span>
              ${hasPermission('managePositions') ? `
              <div class="dept-actions" onclick="event.stopPropagation()">
                <button class="icon-btn" onclick="editPosition(${pos.id})" title="${t('edit')}">✏️</button>
                <button class="icon-btn" onclick="deletePosition(${pos.id})" title="${t('delete')}">🗑️</button>
              </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

// Access Matrix View
function showAccess(positionId) {
  currentPosition = currentDepartment.positions.find(p => p.id === positionId);
  if (!currentPosition) return;

  document.getElementById('positionView').style.display = 'none';
  document.getElementById('accessView').style.display = 'block';
  
  // Hide the add department button when viewing access matrix
  document.getElementById('addDepartmentBtn').style.display = 'none';

  updateBreadcrumb(['Departments', currentDepartment.name, currentPosition.name]);
  renderAccessMatrix();
  // Update translations after rendering
  translationService.updateUI();
}

function renderAccessMatrix() {
  const container = document.getElementById('accessView');
  const positionKey = `${currentDepartment.id}-${currentPosition.id}`;
  const access = data.accessMatrix[positionKey] || {};

  const categorizedSystems = {};
  data.systems.forEach(sys => {
    const category = data.categories.find(c => c.id === sys.categoryId);
    const catName = category ? category.name : 'Uncategorized';
    if (!categorizedSystems[catName]) {
      categorizedSystems[catName] = [];
    }
    categorizedSystems[catName].push(sys);
  });

  container.innerHTML = `
    <div class="action-bar">
      <h2>${t('accessManagement', { positionName: currentPosition.name })}</h2>
    </div>
    <div class="access-section">
      ${Object.entries(categorizedSystems).map(([catName, systems]) => `
        <div class="category-block">
          <div class="category-title">${catName}</div>
          <div class="systems-grid">
            ${systems.map(sys => `
              <div class="system-checkbox">
                <input
                  type="checkbox"
                  id="sys-${sys.id}"
                  ${access[sys.id] ? 'checked' : ''}
                  onchange="toggleAccess(${sys.id})"
                  ${!hasPermission('managePositions') ? 'disabled' : ''}
                >
                <label for="sys-${sys.id}">${sys.name}</label>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function toggleAccess(systemId) {
  const positionKey = `${currentDepartment.id}-${currentPosition.id}`;
  if (!data.accessMatrix[positionKey]) {
    data.accessMatrix[positionKey] = {};
  }
  data.accessMatrix[positionKey][systemId] = !data.accessMatrix[positionKey][systemId];
  await saveData();
}

// Systems Management
function renderSystemsView() {
  const container = document.getElementById('systemsView');
  
  if (data.categories.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Categories Yet</h3>
        <p>Click "Add Category" to get started</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="systems-manager">
      ${data.categories.map(cat => {
        const systems = data.systems.filter(s => s.categoryId === cat.id);
        return `
          <div class="category-manager">
            <div class="category-header">
              <span class="category-name">${cat.name}</span>
              <div>
                ${hasPermission('manageSystems') ? `<button class="btn btn-success" onclick="openModal('addSystem', ${cat.id})">${t('add')}</button>` : ''}
                ${hasPermission('manageCategories') ? `
                <button class="icon-btn" onclick="editCategory(${cat.id})" title="${t('edit')}">✏️</button>
                <button class="icon-btn" onclick="deleteCategory(${cat.id})" title="${t('delete')}">🗑️</button>
                ` : ''}
              </div>
            </div>
            ${systems.length === 0 ? `<p style="color:#6c757d; font-size: 0.9em;">${t('noSystems')}</p>` : `
              <div class="system-list">
                ${systems.map(sys => `
                  <div class="system-tag">
                    <span>${sys.name}</span>
                    ${hasPermission('manageSystems') ? `
                    <div>
                      <button class="icon-btn" onclick="editSystem(${sys.id})" title="${t('edit')}">✏️</button>
                      <button class="icon-btn" onclick="deleteSystem(${sys.id})" title="${t('delete')}">🗑️</button>
                    </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Modal Management
function openModal(type, param) {
  const modal = document.getElementById('modal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  switch(type) {
    case 'addDepartment':
      title.textContent = t('addDepartmentTitle');
      body.innerHTML = `
        <div class="form-group">
          <label>${t('departmentName')}</label>
          <input type="text" id="deptName" placeholder="${t('enterDepartmentName')}">
        </div>
        <button class="btn btn-primary" onclick="addDepartment()">${t('addDepartmentBtn')}</button>
      `;
      break;

    case 'editDepartment':
      const dept = param;
      title.textContent = t('editDepartmentTitle');
      body.innerHTML = `
        <div class="form-group">
          <label>${t('departmentName')}</label>
          <input type="text" id="deptName" value="${dept.name}">
        </div>
        <button class="btn btn-primary" onclick="updateDepartment(${dept.id})">${t('updateDepartmentBtn')}</button>
      `;
      break;

    case 'addPosition':
      title.textContent = t('addPositionTitle');
      body.innerHTML = `
        <div class="form-group">
          <label>${t('positionName')}</label>
          <input type="text" id="posName" placeholder="${t('enterPositionName')}">
        </div>
        <button class="btn btn-primary" onclick="addPosition()">${t('addPositionBtn')}</button>
      `;
      break;

    case 'editPosition':
      const pos = param;
      title.textContent = t('editPositionTitle');
      body.innerHTML = `
        <div class="form-group">
          <label>${t('positionName')}</label>
          <input type="text" id="posName" value="${pos.name}">
        </div>
        <button class="btn btn-primary" onclick="updatePosition(${pos.id})">${t('updatePositionBtn')}</button>
      `;
      break;

    case 'addCategory':
      title.textContent = t('addCategoryTitle');
      body.innerHTML = `
        <div class="form-group">
          <label>${t('categoryName')}</label>
          <input type="text" id="catName" placeholder="${t('enterCategoryName')}">
        </div>
        <button class="btn btn-primary" onclick="addCategory()">${t('addCategoryBtn')}</button>
      `;
      break;

    case 'editCategory':
      const cat = param;
      title.textContent = t('editCategoryTitle');
      body.innerHTML = `
        <div class="form-group">
          <label>${t('categoryName')}</label>
          <input type="text" id="catName" value="${cat.name}">
        </div>
        <button class="btn btn-primary" onclick="updateCategory(${cat.id})">${t('updateCategoryBtn')}</button>
      `;
      break;

    case 'addSystem':
      title.textContent = t('addSystemTitle');
      body.innerHTML = `
        <div class="form-group">
          <label>${t('systemName')}</label>
          <input type="text" id="sysName" placeholder="${t('enterSystemName')}">
        </div>
        <div class="form-group">
          <label>${t('category')}</label>
          <select id="sysCat">
            ${data.categories.map(c => `
              <option value="${c.id}" ${c.id === param ? 'selected' : ''}>${c.name}</option>
            `).join('')}
          </select>
        </div>
        <button class="btn btn-primary" onclick="addSystem()">${t('addSystemBtn')}</button>
      `;
      break;

    case 'editSystem':
      const sys = param;
      title.textContent = t('editSystemTitle');
      body.innerHTML = `
        <div class="form-group">
          <label>${t('systemName')}</label>
          <input type="text" id="sysName" value="${sys.name}">
        </div>
        <div class="form-group">
          <label>${t('category')}</label>
          <select id="sysCat">
            ${data.categories.map(c => `
              <option value="${c.id}" ${c.id === sys.categoryId ? 'selected' : ''}>${c.name}</option>
            `).join('')}
          </select>
        </div>
        <button class="btn btn-primary" onclick="updateSystem(${sys.id})">${t('updateSystemBtn')}</button>
      `;
      break;

    case 'addUser':
      title.textContent = t('addUser');
      body.innerHTML = `
        <div class="form-group">
          <label>${t('username')}</label>
          <input type="text" id="username">
        </div>
        <div class="form-group">
          <label>${t('password')}</label>
          <input type="password" id="password">
        </div>
        <div class="form-group">
          <label>${t('role')}</label>
          <select id="role">
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="approver">Approver</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="addUser()">${t('addUser')}</button>
      `;
      break;

    case 'editUser':
      const user = param;
      title.textContent = t('editUser');
      body.innerHTML = `
        <div class="form-group">
          <label>${t('username')}</label>
          <input type="text" id="username" value="${user.username}" disabled>
        </div>
        <div class="form-group">
          <label>${t('password')}</label>
          <input type="password" id="password" placeholder="${t('leaveBlank')}">
        </div>
        <div class="form-group">
          <label>${t('role')}</label>
          <select id="role">
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="editor" ${user.role === 'editor' ? 'selected' : ''}>Editor</option>
            <option value="approver" ${user.role === 'approver' ? 'selected' : ''}>Approver</option>
            <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="updateUser('${user.username}')">${t('updateUser')}</button>
      `;
      break;
  }

  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

// CRUD Operations - Departments
async function addDepartment() {
  const name = document.getElementById('deptName').value.trim();
  if (!name) {
      console.log('Department name is required');
      return; 
  }

  const newDept = {
    id: Date.now(),
    name: name,
    positions: []
  };

  data.departments.push(newDept);
  await saveData();
  closeModal();
  renderDepartments();
}

async function editDepartment(id) {
  const dept = data.departments.find(d => d.id === id);
  if (!dept) return;
  openModal('editDepartment', dept);
}

async function updateDepartment(id) {
  const name = document.getElementById('deptName').value.trim();
  if (!name) {
      console.log('Department name is required');
      return;
  }

  const dept = data.departments.find(d => d.id === id);
  if (dept) {
    dept.name = name;
    await saveData();
    closeModal();
    renderDepartments();
    if (currentDepartment && currentDepartment.id === id) {
      currentDepartment.name = name;
      updateBreadcrumb(['Departments', name]);
    }
  }
}

async function deleteDepartment(id) {
  const dept = data.departments.find(d => d.id === id);
  if (!dept) return;
  
  const confirmed = await window.electronAPI.showConfirmDialog(
    t('confirmDeleteDepartment', { departmentName: dept.name })
  );
  
  if (!confirmed) return;
  
  data.departments = data.departments.filter(d => d.id !== id);
  
  // Clean up access matrix
  Object.keys(data.accessMatrix).forEach(key => {
    if (key.startsWith(`${id}-`)) {
      delete data.accessMatrix[key];
    }
  });
  
  await saveData();
  renderDepartments();
}

// CRUD Operations - Positions
async function addPosition() {
  const name = document.getElementById('posName').value.trim();
  if (!name) {
      console.log('Position name is required');
      return;
  }

  if (!currentDepartment.positions) {
    currentDepartment.positions = [];
  }

  const newPos = {
    id: Date.now(),
    name: name
  };

  currentDepartment.positions.push(newPos);
  await saveData();
  closeModal();
  renderPositions();
}

async function editPosition(id) {
  const pos = currentDepartment.positions.find(p => p.id === id);
  if (!pos) return;
  openModal('editPosition', pos);
}

async function updatePosition(id) {
  const name = document.getElementById('posName').value.trim();
  if (!name) {
      console.log('Position name is required');
      return;
  }

  const pos = currentDepartment.positions.find(p => p.id === id);
  if (pos) {
    pos.name = name;
    await saveData();
    closeModal();
    renderPositions();
    // Update translations after rendering
    translationService.updateUI();
  }
}

async function deletePosition(id) {
  const pos = currentDepartment.positions.find(p => p.id === id);
  if (!pos) return;
  
  const confirmed = await window.electronAPI.showConfirmDialog(
    t('confirmDeletePosition', { positionName: pos.name })
  );
  
  if (!confirmed) return;
  
  currentDepartment.positions = currentDepartment.positions.filter(p => p.id !== id);
  
  // Clean up access matrix
  const positionKey = `${currentDepartment.id}-${id}`;
  delete data.accessMatrix[positionKey];
  
  await saveData();
  renderPositions();
}

// CRUD Operations - Categories
async function addCategory() {
  const name = document.getElementById('catName').value.trim();
  if (!name) {
      console.log('Category name is required');
      return;
  }

  const newCat = {
    id: Date.now(),
    name: name
  };

  data.categories.push(newCat);
  await saveData();
  closeModal();
  renderSystemsView();
  // Update translations after rendering
  translationService.updateUI();
}

async function editCategory(id) {
  const cat = data.categories.find(c => c.id === id);
  if (!cat) return;
  openModal('editCategory', cat);
}

async function updateCategory(id) {
  const name = document.getElementById('catName').value.trim();
  if (!name) {
      console.log('Category name is required');
      return;
  }

  const cat = data.categories.find(c => c.id === id);
  if (cat) {
    cat.name = name;
    await saveData();
    closeModal();
    renderSystemsView();
  }
}

async function deleteCategory(id) {
  const systems = data.systems.filter(s => s.categoryId === id);
  if (systems.length > 0) {
    await window.electronAPI.showAlertDialog(
      t('cannotDeleteCategoryWithSystems')
    );
    return;
  }
  
  const cat = data.categories.find(c => c.id === id);
  if (!cat) return;
  
  const confirmed = await window.electronAPI.showConfirmDialog(
    t('confirmDeleteCategory', { categoryName: cat.name })
  );
  
  if (!confirmed) return;
  
  data.categories = data.categories.filter(c => c.id !== id);
  await saveData();
  renderSystemsView();
  // Update translations after rendering
  translationService.updateUI();
}

// CRUD Operations - Systems
async function addSystem() {
  const name = document.getElementById('sysName').value.trim();
  const categoryId = parseInt(document.getElementById('sysCat').value);
  
  if (!name) {
      console.log('System name is required');
      return;
  }

  const newSys = {
    id: Date.now(),
    name: name,
    categoryId: categoryId
  };

  data.systems.push(newSys);
  await saveData();
  closeModal();
  renderSystemsView();
  // Update translations after rendering
  translationService.updateUI();
}

async function editSystem(id) {
  const sys = data.systems.find(s => s.id === id);
  if (!sys) return;
  openModal('editSystem', sys);
}

async function updateSystem(id) {
  const name = document.getElementById('sysName').value.trim();
  const categoryId = parseInt(document.getElementById('sysCat').value);
  
  if (!name) {
      console.log('System name is required');
      return;
  }

  const sys = data.systems.find(s => s.id === id);
  if (sys) {
    sys.name = name;
    sys.categoryId = categoryId;
    await saveData();
    closeModal();
    renderSystemsView();
  }
}

async function deleteSystem(id) {
  const sys = data.systems.find(s => s.id === id);
  if (!sys) return;
  
  const confirmed = await window.electronAPI.showConfirmDialog(
    t('confirmDeleteSystem', { systemName: sys.name })
  );
  
  if (!confirmed) return;
  
  data.systems = data.systems.filter(s => s.id !== id);
  
  // Clean up access matrix
  Object.keys(data.accessMatrix).forEach(key => {
    if (data.accessMatrix[key][id]) {
      delete data.accessMatrix[key][id];
    }
  });
  
  await saveData();
  renderSystemsView();
  // Update translations after rendering
  translationService.updateUI();
}

// Form Generator
function renderFormGenerator() {
  const container = document.getElementById('formGeneratorView');
  
  // Get current date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Get departments for dropdown
  const departmentOptions = data.departments.map(dept =>
    `<option value="${dept.name}">${dept.name}</option>`
  ).join('');

  container.innerHTML = `
    <div class="form-container">
      <div class="form-group">
        <label for="empName">${t('employeeName')}</label>
        <input type="text" id="empName" placeholder="${t('enterFullName')}">
      </div>
      <div class="form-group">
        <label for="empOnQ">${t('idmLoginName')}</label>
        <input type="text" id="empOnQ" placeholder="${t('enterIdmLoginName')}">
      </div>
      <div class="form-group">
        <label for="empMail">${t('emailAccount')}</label>
        <input type="email" id="empMail" placeholder="${t('enterEmailAddress')}">
      </div>
      <div class="form-group">
        <label for="empDept">${t('department')}</label>
        <select id="empDept" onchange="updatePositionDropdown()">
          <option value="">${t('selectDepartment')}</option>
          ${departmentOptions}
        </select>
      </div>
      <div class="form-group">
        <label for="empPos">${t('position')}</label>
        <select id="empPos">
          <option value="">${t('selectPosition')}</option>
          <!-- Positions will be populated based on department selection -->
        </select>
      </div>
      <div class="form-group">
        <label for="empDate">${t('startDate')}</label>
        <input type="date" id="empDate" value="${today}">
      </div>
      <button class="btn btn-primary" onclick="generateForm()">${t('generateForm')}</button>
      
      <div id="formOutput" style="display: none;">
        <h3>${t('generatedForm')}</h3>
        <div class="form-actions">
          <button class="btn btn-success" onclick="openGeneratedForm()">${t('openForm')}</button>
          <button class="btn btn-info" onclick="openFormsIndex()">${t('viewAllForms')}</button>
        </div>
        <div id="formStatus"></div>
      </div>
      
      <div id="generatedFormsList" style="margin-top: 2rem;">
        <h3>${t('recentlyGeneratedForms')}</h3>
        <div id="formsListContent"></div>
      </div>
    </div>
  `;
  
  // Initial call to populate positions
  updatePositionDropdown();
  
  // Load recently generated forms
  loadGeneratedForms();
  // Update translations after rendering
  translationService.updateUI();
}

// Configuration Tab
function renderConfiguration() {
  const container = document.getElementById('configurationView');
  
  container.innerHTML = `
    <div class="config-container">
      <div class="config-module" style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 0.375rem; padding: 1rem; margin-bottom: 1.5rem;">
        <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; font-weight: 600;">${t('formGenerationSettings')}</h3>
        <div class="form-group">
          <div class="flex items-center justify-between">
            <label for="onlyCheckedSystems">${t('showOnlyCheckedSystems')}</label>
            <input type="checkbox" id="onlyCheckedSystems" onchange="saveConfiguration()" style="width: 1.5rem; height: 1.5rem;">
          </div>
          <p class="text-sm text-gray-600" style="margin-top: 0.25rem; margin-bottom: 0;">${t('showOnlyCheckedSystemsDescription')}</p>
        </div>
      </div>
      
      <div class="config-module" style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 0.375rem; padding: 1rem; margin-bottom: 1.5rem;">
        <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; font-weight: 600;">${t('languageSettings')}</h3>
        <div class="form-group">
          <label for="languageSelect">${t('selectLanguage')}</label>
          <select id="languageSelect" onchange="changeLanguage(this.value)" style="width: 100%; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 0.25rem;">
            <option value="en">${t('english')}</option>
            <option value="es">${t('spanish')}</option>
          </select>
        </div>
      </div>
      
      <div class="config-module" style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 0.375rem; padding: 1rem; margin-bottom: 1.5rem;">
        <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; font-weight: 600;">${t('cleanupSettings')}</h3>
        <div class="form-group">
          <p class="text-sm text-gray-700" style="margin-bottom: 1rem;">${t('cleanupDescription')}</p>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-warning" onclick="cleanupLeftoverFiles()">${t('cleanupLeftoverFiles')}</button>
            <button class="btn btn-danger" onclick="cleanupOldFiles()">${t('cleanupOldFiles')}</button>
          </div>
          <p class="text-sm text-gray-600" style="margin-top: 0.5rem; margin-bottom: 0;">${t('cleanupNote')}</p>
        </div>
      </div>
      
      <div class="config-module" style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 0.375rem; padding: 1rem;">
        <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; font-weight: 600;">${t('about')}</h3>
        <div class="form-group">
          <p class="text-sm text-gray-700">${t('appVersion')}</p>
          <p class="text-sm text-gray-600">${t('appDescription')}</p>
        </div>
      </div>
    </div>
  `;
  
  // Load saved configuration
  loadConfiguration();
}

// Load configuration from localStorage
function loadConfiguration() {
  const onlyCheckedSystems = localStorage.getItem('onlyCheckedSystems') === 'true';
  document.getElementById('onlyCheckedSystems').checked = onlyCheckedSystems;
  
  // Load language setting
  const currentLanguage = translationService.getCurrentLanguage();
  document.getElementById('languageSelect').value = currentLanguage;
}

// Save configuration to localStorage
function saveConfiguration() {
  const onlyCheckedSystems = document.getElementById('onlyCheckedSystems').checked;
  localStorage.setItem('onlyCheckedSystems', onlyCheckedSystems.toString());
  console.log('Configuration saved:', { onlyCheckedSystems });
}

// Change language function
function changeLanguage(lang) {
  translationService.setLanguage(lang);
  console.log('Language changed to:', lang);
}

function updatePositionDropdown() {
  const deptName = document.getElementById('empDept').value;
  const posSelect = document.getElementById('empPos');
  
  posSelect.innerHTML = `<option value="">${t('selectPosition')}</option>`; // Clear existing options
  
  if (deptName) {
    const dept = data.departments.find(d => d.name === deptName);
    if (dept && dept.positions) {
      const positionOptions = dept.positions.map(pos =>
        `<option value="${pos.name}">${pos.name}</option>`
      ).join('');
      posSelect.innerHTML += positionOptions;
    }
  }
}

async function generateForm() {
  try {
    // Get form data
    const userData = {
      name: document.getElementById('empName').value.trim(),
      idmLogin: document.getElementById('empOnQ').value.trim(),
      email: document.getElementById('empMail').value.trim(),
      department: document.getElementById('empDept').value,
      position: document.getElementById('empPos').value,
      startDate: document.getElementById('empDate').value
    };

    // Get configuration options from localStorage
    const onlyCheckedSystems = localStorage.getItem('onlyCheckedSystems') === 'true';
    const options = {
      onlyCheckedSystems: onlyCheckedSystems
    };

    // Validate required fields
    if (!userData.name || !userData.department || !userData.position) {
      await window.electronAPI.showAlertDialog(t('pleaseFillRequiredFields'));
      return;
    }

    // Show loading state
    const statusDiv = document.getElementById('formStatus');
    statusDiv.innerHTML = `<p class="text-blue-600">${t('generatingForm')}</p>`;
    document.getElementById('formOutput').style.display = 'block';

    // Generate form via main process with options
    const result = await window.electronAPI.generateForm(userData, options);

    if (result.success) {
      statusDiv.innerHTML = `
        <p class="text-green-600">${t('formsGeneratedSuccessfully')}</p>
        <p class="text-sm text-gray-600">${t('solicitudFile')}: ${result.solicitudFilename}</p>
        <p class="text-sm text-gray-600">${t('checklistFile')}: ${result.checklistFilename}</p>
      `;
      
      // Store the generated file paths for later use
      window.lastGeneratedSolicitud = result.solicitudFilename;
      window.lastGeneratedChecklist = result.checklistFilename;
      window.lastEmployeeFolder = result.formResults.employeeFolder;
      
      // Update form actions to show both files
      const formActionsDiv = document.querySelector('#formOutput .form-actions');
      formActionsDiv.innerHTML = `
        <button class="btn btn-success" onclick="openGeneratedSolicitud()">${t('openSolicitud')}</button>
        <button class="btn btn-info" onclick="openGeneratedChecklist()">${t('openChecklist')}</button>
        <button class="btn btn-warning" onclick="openEmployeeFolder()">${t('openEmployeeFolder')}</button>
        <button class="btn btn-secondary" onclick="openFormsIndex()">${t('viewAllForms')}</button>
      `;
      
      // Reload the forms list
      loadGeneratedForms();
      // Update translations after rendering
      translationService.updateUI();
    } else {
      statusDiv.innerHTML = `<p class="text-red-600">${t('errorGeneratingForm', { error: result.error })}</p>`;
    }
  } catch (error) {
    console.error('Error generating form:', error);
    const statusDiv = document.getElementById('formStatus');
    statusDiv.innerHTML = `<p class="text-red-600">${t('errorGeneratingForm', { error: error.message })}</p>`;
  }
}

async function openGeneratedSolicitud() {
  if (window.lastGeneratedSolicitud) {
    await window.electronAPI.openGeneratedFile(window.lastGeneratedSolicitud);
  } else {
    await window.electronAPI.showAlertDialog(t('noFormGeneratedYet'));
  }
}

async function openGeneratedChecklist() {
  if (window.lastGeneratedChecklist) {
    await window.electronAPI.openGeneratedFile(window.lastGeneratedChecklist);
  } else {
    await window.electronAPI.showAlertDialog(t('noFormGeneratedYet'));
  }
}

async function openEmployeeFolder() {
  if (window.lastEmployeeFolder) {
    // Extract employee name from folder path
    const pathParts = window.lastEmployeeFolder.split(/[/\\]/);
    const folderName = pathParts[pathParts.length - 1];
    await window.electronAPI.openEmployeeFolder(folderName);
  } else {
    await window.electronAPI.showAlertDialog(t('noFormGeneratedYet'));
  }
}

async function openFormsIndex() {
  await window.electronAPI.openGeneratedFile('index.html');
}

async function loadGeneratedForms() {
  try {
    const forms = await window.electronAPI.getGeneratedForms();
    const formsListContent = document.getElementById('formsListContent');
    
    if (forms.length === 0) {
      formsListContent.innerHTML = `<p class="text-gray-500">${t('noFormsGeneratedYet')}</p>`;
      return;
    }

    // Show last 5 forms
    const recentForms = forms.slice(-5).reverse();
    
    formsListContent.innerHTML = `
      <div class="forms-table">
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-4 py-2 text-left">${t('employee')}</th>
              <th class="border border-gray-300 px-4 py-2 text-left">${t('department')}</th>
              <th class="border border-gray-300 px-4 py-2 text-left">${t('position')}</th>
              <th class="border border-gray-300 px-4 py-2 text-left">${t('type')}</th>
              <th class="border border-gray-300 px-4 py-2 text-left">${t('generated')}</th>
              <th class="border border-gray-300 px-4 py-2 text-left">${t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${recentForms.map(form => {
              const typeText = form.type === 'checklist' ? t('checklist') : t('solicitud');
              const typeClass = form.type === 'checklist' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
              return `
              <tr>
                <td class="border border-gray-300 px-4 py-2">${form.name}</td>
                <td class="border border-gray-300 px-4 py-2">${form.department}</td>
                <td class="border border-gray-300 px-4 py-2">${form.position}</td>
                <td class="border border-gray-300 px-4 py-2">
                  <span class="px-2 py-1 text-xs rounded-full ${typeClass}">${typeText}</span>
                </td>
                <td class="border border-gray-300 px-4 py-2">${new Date(form.generatedAt).toLocaleString('es-CR')}</td>
                <td class="border border-gray-300 px-4 py-2">
                  <button class="btn btn-sm btn-primary" onclick="window.electronAPI.openGeneratedFile('${form.filename}')">${t('open')}</button>
                </td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
        ${forms.length > 5 ? `
          <div class="mt-4">
            <button class="btn btn-info" onclick="openFormsIndex()">${t('viewAllFormsCount', { count: forms.length })}</button>
          </div>
        ` : ''}
      </div>
    `;
  } catch (error) {
    console.error('Error loading generated forms:', error);
    document.getElementById('formsListContent').innerHTML =
      `<p class="text-red-600">${t('errorLoadingFormsList')}</p>`;
  }
}

// Breadcrumb
function updateBreadcrumb(items) {
  const breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.innerHTML = items.map((item, index) => {
    const isLast = index === items.length - 1;
    const isFirst = index === 0;
    // Use translation for the first item (Departments) if it's the first breadcrumb
    const displayText = isFirst && item === 'Departments' ? t('departments') : item;
    return `
      ${index > 0 ? '<span style="color: #6c757d; margin: 0 5px;">/</span>' : ''}
      <span class="breadcrumb-item ${isLast ? 'active' : ''}"
            onclick="${isFirst ? 'showDepartments()' : index === 1 ? `showPositions(${currentDepartment.id})` : ''}">
        ${displayText}
      </span>
    `;
  }).join('');
}

// Search/Filter
function filterItems() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  
  if (document.getElementById('departmentView').style.display !== 'none') {
    const cards = document.querySelectorAll('.dept-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? 'block' : 'none';
    });
  } else if (document.getElementById('positionView').style.display !== 'none') {
    const items = document.querySelectorAll('.position-item');
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? 'block' : 'none';
    });
  }
}

// Close modal on outside click
document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeModal();
  }
});

// Make data globally accessible for modal functions
window.data = data;

// Cleanup functions
async function cleanupLeftoverFiles() {
  try {
    const confirmed = await window.electronAPI.showConfirmDialog(t('confirmCleanupLeftoverFiles'));
    if (!confirmed) return;
    
    const result = await window.electronAPI.cleanupLeftoverFiles();
    if (result.success) {
      await window.electronAPI.showAlertDialog(t('cleanupLeftoverFilesSuccess'));
    } else {
      await window.electronAPI.showAlertDialog(t('cleanupLeftoverFilesError', { error: result.error }));
    }
  } catch (error) {
    console.error('Error cleaning up leftover files:', error);
    await window.electronAPI.showAlertDialog(t('cleanupLeftoverFilesError', { error: error.message }));
  }
}

async function cleanupOldFiles() {
  try {
    const confirmed = await window.electronAPI.showConfirmDialog(t('confirmCleanupOldFiles'));
    if (!confirmed) return;
    
    const result = await window.electronAPI.cleanupOldFiles({ maxAgeHours: 24 });
    if (result.success) {
      await window.electronAPI.showAlertDialog(t('cleanupOldFilesSuccess'));
    } else {
      await window.electronAPI.showAlertDialog(t('cleanupOldFilesError', { error: result.error }));
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    await window.electronAPI.showAlertDialog(t('cleanupOldFilesError', { error: error.message }));
  }
}

function renderUserManagement() {
    const container = document.getElementById('userManagementView');
    if (!hasPermission('manageUsers')) {
        container.innerHTML = `<p>${t('unauthorized')}</p>`;
        return;
    }

    container.innerHTML = `
        <div class="action-bar">
            <h2>${t('userManagement')}</h2>
            <button class="btn btn-primary" onclick="openModal('addUser')">${t('addUser')}</button>
        </div>
        <div class="user-list">
            ${(data.users || []).map(user => `
                <div class="user-item">
                    <div class="user-info">
                        <span class="user-name">${user.username}</span>
                        <span class="user-role">${user.role}</span>
                    </div>
                    <div class="user-actions">
                        <button class="icon-btn" onclick="editUser('${user.username}')" title="${t('edit')}">✏️</button>
                        <button class="icon-btn" onclick="deleteUser('${user.username}')" title="${t('delete')}">🗑️</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// CRUD Operations - Users
async function addUser() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;

    if (!username || !password) {
        alert(t('usernameAndPasswordRequired'));
        return;
    }

    const result = await window.auth.addUser({ username, password, role });
    if (result.success) {
        await loadData();
        closeModal();
        renderUserManagement();
    } else {
        alert(result.error);
    }
}

async function editUser(username) {
    const user = data.users.find(u => u.username === username);
    if (user) {
        openModal('editUser', user);
    }
}

async function updateUser(username) {
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;

    const result = await window.auth.updateUser({ username, password, role });
    if (result.success) {
        await loadData();
        closeModal();
        renderUserManagement();
    } else {
        alert(result.error);
    }
}

async function deleteUser(username) {
    const confirmed = await window.electronAPI.showConfirmDialog(t('confirmDeleteUser', { username }));
    if (confirmed) {
        data.users = data.users.filter(u => u.username !== username);
        await saveData();
        renderUserManagement();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await window.auth.getCurrentUser();
    await loadData();

    if (currentUser) {
        document.querySelector('.sidebar').style.display = 'flex';
        document.querySelector('.content').style.display = 'block';

        // Hide tabs based on roles
        if (!hasPermission('manageSystems') && !hasPermission('manageCategories')) {
            document.querySelector('.tab[onclick*="systems"]').style.display = 'none';
        }
        if (!hasPermission('generateForms')) {
            document.querySelector('.tab[onclick*="formGenerator"]').style.display = 'none';
        }
        if (!hasPermission('viewConfigurations')) {
            document.querySelector('.tab[onclick*="configuration"]').style.display = 'none';
        }
        if (!hasPermission('manageUsers')) {
            document.querySelector('.tab[onclick*="users"]').style.display = 'none';
        }

        renderDepartments();
    }

    // Apply translations after initial render
    translationService.updateUI();
});