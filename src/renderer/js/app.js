// Data Structure
let data = {
  departments: [],
  systems: [],
  categories: [],
  accessMatrix: {}
};

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
async function saveData() {
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
  
  if (tab === 'systems') {
    renderSystemsView();
  } else if (tab === 'formGenerator') { // ADDED
    renderFormGenerator();
  } else if (tab === 'departments') { // UPDATED
    // When switching back to departments, reset to the top level
    showDepartments();
  }
}

// Department View
function showDepartments() {
  currentDepartment = null;
  currentPosition = null;
  document.getElementById('departmentView').style.display = 'block';
  document.getElementById('positionView').style.display = 'none';
  document.getElementById('accessView').style.display = 'none';
  
  updateBreadcrumb(['Departments']);
  renderDepartments();
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
          <div class="dept-actions" onclick="event.stopPropagation()">
            <button class="icon-btn" onclick="editDepartment(${dept.id})" title="Edit">✏️</button>
            <button class="icon-btn" onclick="deleteDepartment(${dept.id})" title="Delete">🗑️</button>
          </div>
          <h3>${dept.name}</h3>
          <p>${dept.positions ? dept.positions.length : 0} positions</p>
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

  updateBreadcrumb(['Departments', currentDepartment.name]);
  renderPositions();
}

function renderPositions() {
  const container = document.getElementById('positionView');
  const positions = currentDepartment.positions || [];

  container.innerHTML = `
    <div class="action-bar">
      <h2>${currentDepartment.name} - Positions</h2>
      <button class="btn btn-primary" onclick="openModal('addPosition')">+ Add Position</button>
    </div>
    ${positions.length === 0 ? `
      <div class="empty-state">
        <h3>No Positions Yet</h3>
        <p>Click "Add Position" to add a position to this department</p>
      </div>
    ` : `
      <div class="position-list">
        ${positions.map(pos => `
          <div class="position-item" onclick="showAccess(${pos.id})">
            <div class="position-header">
              <span class="position-name">${pos.name}</span>
              <div class="dept-actions" onclick="event.stopPropagation()">
                <button class="icon-btn" onclick="editPosition(${pos.id})" title="Edit">✏️</button>
                <button class="icon-btn" onclick="deletePosition(${pos.id})" title="Delete">🗑️</button>
              </div>
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

  updateBreadcrumb(['Departments', currentDepartment.name, currentPosition.name]);
  renderAccessMatrix();
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
      <h2>Access Management - ${currentPosition.name}</h2>
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
                <button class="btn btn-success" onclick="openModal('addSystem', ${cat.id})">+ Add</button>
                <button class="icon-btn" onclick="editCategory(${cat.id})">✏️</button>
                <button class="icon-btn" onclick="deleteCategory(${cat.id})">🗑️</button>
              </div>
            </div>
            ${systems.length === 0 ? '<p style="color:#6c757d; font-size: 0.9em;">No systems</p>' : `
              <div class="system-list">
                ${systems.map(sys => `
                  <div class="system-tag">
                    <span>${sys.name}</span>
                    <div>
                      <button class="icon-btn" onclick="editSystem(${sys.id})">✏️</button>
                      <button class="icon-btn" onclick="deleteSystem(${sys.id})">🗑️</button>
                    </div>
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
      title.textContent = 'Add Department';
      body.innerHTML = `
        <div class="form-group">
          <label>Department Name</label>
          <input type="text" id="deptName" placeholder="Enter department name">
        </div>
        <button class="btn btn-primary" onclick="addDepartment()">Add Department</button>
      `;
      break;

    case 'editDepartment':
      const dept = param;
      title.textContent = 'Edit Department';
      body.innerHTML = `
        <div class="form-group">
          <label>Department Name</label>
          <input type="text" id="deptName" value="${dept.name}">
        </div>
        <button class="btn btn-primary" onclick="updateDepartment(${dept.id})">Update Department</button>
      `;
      break;

    case 'addPosition':
      title.textContent = 'Add Position';
      body.innerHTML = `
        <div class="form-group">
          <label>Position Name</label>
          <input type="text" id="posName" placeholder="Enter position name">
        </div>
        <button class="btn btn-primary" onclick="addPosition()">Add Position</button>
      `;
      break;

    case 'editPosition':
      const pos = param;
      title.textContent = 'Edit Position';
      body.innerHTML = `
        <div class="form-group">
          <label>Position Name</label>
          <input type="text" id="posName" value="${pos.name}">
        </div>
        <button class="btn btn-primary" onclick="updatePosition(${pos.id})">Update Position</button>
      `;
      break;

    case 'addCategory':
      title.textContent = 'Add Category';
      body.innerHTML = `
        <div class="form-group">
          <label>Category Name</label>
          <input type="text" id="catName" placeholder="Enter category name">
        </div>
        <button class="btn btn-primary" onclick="addCategory()">Add Category</button>
      `;
      break;

    case 'editCategory':
      const cat = param;
      title.textContent = 'Edit Category';
      body.innerHTML = `
        <div class="form-group">
          <label>Category Name</label>
          <input type="text" id="catName" value="${cat.name}">
        </div>
        <button class="btn btn-primary" onclick="updateCategory(${cat.id})">Update Category</button>
      `;
      break;

    case 'addSystem':
      title.textContent = 'Add System';
      body.innerHTML = `
        <div class="form-group">
          <label>System Name</label>
          <input type="text" id="sysName" placeholder="Enter system name">
        </div>
        <div class="form-group">
          <label>Category</label>
          <select id="sysCat">
            ${data.categories.map(c => `
              <option value="${c.id}" ${c.id === param ? 'selected' : ''}>${c.name}</option>
            `).join('')}
          </select>
        </div>
        <button class="btn btn-primary" onclick="addSystem()">Add System</button>
      `;
      break;

    case 'editSystem':
      const sys = param;
      title.textContent = 'Edit System';
      body.innerHTML = `
        <div class="form-group">
          <label>System Name</label>
          <input type="text" id="sysName" value="${sys.name}">
        </div>
        <div class="form-group">
          <label>Category</label>
          <select id="sysCat">
            ${data.categories.map(c => `
              <option value="${c.id}" ${c.id === sys.categoryId ? 'selected' : ''}>${c.name}</option>
            `).join('')}
          </select>
        </div>
        <button class="btn btn-primary" onclick="updateSystem(${sys.id})">Update System</button>
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
    `Are you sure you want to delete the department "${dept.name}"? This will also delete all positions in this department and their access permissions.`
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
  }
}

async function deletePosition(id) {
  const pos = currentDepartment.positions.find(p => p.id === id);
  if (!pos) return;
  
  const confirmed = await window.electronAPI.showConfirmDialog(
    `Are you sure you want to delete the position "${pos.name}"? This will also delete all access permissions for this position.`
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
      'Cannot delete category with systems. Please delete or reassign all systems first.'
    );
    return;
  }
  
  const cat = data.categories.find(c => c.id === id);
  if (!cat) return;
  
  const confirmed = await window.electronAPI.showConfirmDialog(
    `Are you sure you want to delete the category "${cat.name}"?`
  );
  
  if (!confirmed) return;
  
  data.categories = data.categories.filter(c => c.id !== id);
  await saveData();
  renderSystemsView();
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
    `Are you sure you want to delete the system "${sys.name}"? This will also remove access to this system for all positions.`
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
        <label for="empName">Employee Name</label>
        <input type="text" id="empName" placeholder="Enter full name">
      </div>
      <div class="form-group">
        <label for="empOnQ">IDM Login Name</label>
        <input type="text" id="empOnQ" placeholder="Enter IDM login name">
      </div>
      <div class="form-group">
        <label for="empMail">Email Account</label>
        <input type="email" id="empMail" placeholder="Enter email address">
      </div>
      <div class="form-group">
        <label for="empDept">Department</label>
        <select id="empDept" onchange="updatePositionDropdown()">
          <option value="">Select Department</option>
          ${departmentOptions}
        </select>
      </div>
      <div class="form-group">
        <label for="empPos">Position</label>
        <select id="empPos">
          <option value="">Select Position</option>
          <!-- Positions will be populated based on department selection -->
        </select>
      </div>
      <div class="form-group">
        <label for="empDate">Start Date</label>
        <input type="date" id="empDate" value="${today}">
      </div>
      <button class="btn btn-primary" onclick="generateForm()">Generate Form</button>
      
      <div id="formOutput" style="display: none;">
        <h3>Generated Form</h3>
        <div class="form-actions">
          <button class="btn btn-success" onclick="openGeneratedForm()">Open Form</button>
          <button class="btn btn-info" onclick="openFormsIndex()">View All Forms</button>
        </div>
        <div id="formStatus"></div>
      </div>
      
      <div id="generatedFormsList" style="margin-top: 2rem;">
        <h3>Recently Generated Forms</h3>
        <div id="formsListContent"></div>
      </div>
    </div>
  `;
  
  // Initial call to populate positions
  updatePositionDropdown();
  
  // Load recently generated forms
  loadGeneratedForms();
}

function updatePositionDropdown() {
  const deptName = document.getElementById('empDept').value;
  const posSelect = document.getElementById('empPos');
  
  posSelect.innerHTML = '<option value="">Select Position</option>'; // Clear existing options
  
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

    // Validate required fields
    if (!userData.name || !userData.department || !userData.position) {
      await window.electronAPI.showAlertDialog('Please fill in all required fields: Name, Department, and Position.');
      return;
    }

    // Show loading state
    const statusDiv = document.getElementById('formStatus');
    statusDiv.innerHTML = '<p class="text-blue-600">Generating form...</p>';
    document.getElementById('formOutput').style.display = 'block';

    // Generate form via main process
    const result = await window.electronAPI.generateForm(userData);

    if (result.success) {
      statusDiv.innerHTML = `
        <p class="text-green-600">✅ Form generated successfully!</p>
        <p class="text-sm text-gray-600">File: ${result.filename}</p>
      `;
      
      // Store the generated file path for later use
      window.lastGeneratedForm = result.filename;
      
      // Reload the forms list
      loadGeneratedForms();
    } else {
      statusDiv.innerHTML = `<p class="text-red-600">❌ Error: ${result.error}</p>`;
    }
  } catch (error) {
    console.error('Error generating form:', error);
    const statusDiv = document.getElementById('formStatus');
    statusDiv.innerHTML = `<p class="text-red-600">❌ Error: ${error.message}</p>`;
  }
}

async function openGeneratedForm() {
  if (window.lastGeneratedForm) {
    await window.electronAPI.openGeneratedFile(window.lastGeneratedForm);
  } else {
    await window.electronAPI.showAlertDialog('No form has been generated yet.');
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
      formsListContent.innerHTML = '<p class="text-gray-500">No forms generated yet.</p>';
      return;
    }

    // Show last 5 forms
    const recentForms = forms.slice(-5).reverse();
    
    formsListContent.innerHTML = `
      <div class="forms-table">
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-4 py-2 text-left">Employee</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Department</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Position</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Generated</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${recentForms.map(form => `
              <tr>
                <td class="border border-gray-300 px-4 py-2">${form.name}</td>
                <td class="border border-gray-300 px-4 py-2">${form.department}</td>
                <td class="border border-gray-300 px-4 py-2">${form.position}</td>
                <td class="border border-gray-300 px-4 py-2">${new Date(form.generatedAt).toLocaleString('es-CR')}</td>
                <td class="border border-gray-300 px-4 py-2">
                  <button class="btn btn-sm btn-primary" onclick="window.electronAPI.openGeneratedFile('${form.filename}')">Open</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${forms.length > 5 ? `
          <div class="mt-4">
            <button class="btn btn-info" onclick="openFormsIndex()">View All ${forms.length} Forms</button>
          </div>
        ` : ''}
      </div>
    `;
  } catch (error) {
    console.error('Error loading generated forms:', error);
    document.getElementById('formsListContent').innerHTML =
      '<p class="text-red-600">Error loading forms list.</p>';
  }
}

// Breadcrumb
function updateBreadcrumb(items) {
  const breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.innerHTML = items.map((item, index) => {
    const isLast = index === items.length - 1;
    const isFirst = index === 0;
    return `
      ${index > 0 ? '<span style="color: #6c757d; margin: 0 5px;">/</span>' : ''}
      <span class="breadcrumb-item ${isLast ? 'active' : ''}" 
            onclick="${isFirst ? 'showDepartments()' : index === 1 ? `showPositions(${currentDepartment.id})` : ''}">
        ${item}
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

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  renderDepartments();
});