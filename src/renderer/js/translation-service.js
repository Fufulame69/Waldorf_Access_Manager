// Translation Service for Waldorf Access Manager
class TranslationService {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'en';
    this.translations = {
      en: {
        // App Title and Header
        appTitle: 'Hotel Access Matrix Manager',
        hotelAccessManager: 'Hotel Access Manager',
        
        // Sidebar Navigation
        departmentsAndPositions: 'Departments and positions',
        systemsManagement: 'Systems Management',
        formGenerator: 'Form Generator',
        configuration: 'Configuration',
        
        // Departments Tab
        departments: 'Departments',
        searchDepartmentsOrPositions: '🔍 Search departments or positions...',
        addDepartment: '+ Add Department',
        noDepartmentsYet: 'No Departments Yet',
        clickAddDepartmentToStart: 'Click "Add Department" to get started',
        positions: 'positions',
        
        // Positions Tab
        departmentPositions: '{departmentName} - Positions',
        addPosition: '+ Add Position',
        noPositionsYet: 'No Positions Yet',
        clickAddPositionToStart: 'Click "Add Position" to add a position to this department',
        
        // Access Matrix Tab
        accessManagement: 'Access Management - {positionName}',
        
        // Systems Tab
        systemCategories: 'System Categories',
        addCategory: '+ Add Category',
        noCategoriesYet: 'No Categories Yet',
        clickAddCategoryToStart: 'Click "Add Category" to get started',
        noSystems: 'No systems',
        add: '+ Add',
        
        // Form Generator Tab
        newEmployeeAccessForm: 'New Employee Access Form',
        employeeName: 'Employee Name',
        enterFullName: 'Enter full name',
        idmLoginName: 'IDM Login Name',
        enterIdmLoginName: 'Enter IDM login name',
        emailAccount: 'Email Account',
        enterEmailAddress: 'Enter email address',
        department: 'Department',
        selectDepartment: 'Select Department',
        position: 'Position',
        selectPosition: 'Select Position',
        startDate: 'Start Date',
        generateForm: 'Generate Form',
        generatedForm: 'Generated Form',
        openForm: 'Open Form',
        viewAllForms: 'View All Forms',
        recentlyGeneratedForms: 'Recently Generated Forms',
        noFormsGeneratedYet: 'No forms generated yet.',
        employee: 'Employee',
        generated: 'Generated',
        actions: 'Actions',
        open: 'Open',
        viewAllFormsCount: 'View All {count} Forms',
        
        // Configuration Tab
        formGenerationSettings: 'Form Generation Settings',
        showOnlyCheckedSystems: 'Show only checked systems in generated form',
        showOnlyCheckedSystemsDescription: 'When enabled, only systems with access permissions will be displayed in the generated form.',
        about: 'About',
        appVersion: 'Waldorf Access Manager v1.0.0',
        appDescription: 'A system for managing employee access to hotel systems and applications.',
        languageSettings: 'Language Settings',
        selectLanguage: 'Select Language',
        english: 'English',
        spanish: 'Spanish',
        
        // Modal Titles
        addDepartmentTitle: 'Add Department',
        editDepartmentTitle: 'Edit Department',
        addPositionTitle: 'Add Position',
        editPositionTitle: 'Edit Position',
        addCategoryTitle: 'Add Category',
        editCategoryTitle: 'Edit Category',
        addSystemTitle: 'Add System',
        editSystemTitle: 'Edit System',
        
        // Form Labels
        departmentName: 'Department Name',
        enterDepartmentName: 'Enter department name',
        positionName: 'Position Name',
        enterPositionName: 'Enter position name',
        categoryName: 'Category Name',
        enterCategoryName: 'Enter category name',
        systemName: 'System Name',
        enterSystemName: 'Enter system name',
        category: 'Category',
        
        // Buttons
        addDepartmentBtn: 'Add Department',
        updateDepartmentBtn: 'Update Department',
        addPositionBtn: 'Add Position',
        updatePositionBtn: 'Update Position',
        addCategoryBtn: 'Add Category',
        updateCategoryBtn: 'Update Category',
        addSystemBtn: 'Add System',
        updateSystemBtn: 'Update System',
        
        // Messages
        changesSavedAutomatically: '✓ Changes saved automatically',
        generatingForm: 'Generating form...',
        formGeneratedSuccessfully: '✅ Form generated successfully!',
        file: 'File',
        errorGeneratingForm: '❌ Error: {error}',
        noFormGeneratedYet: 'No form has been generated yet.',
        errorLoadingFormsList: 'Error loading forms list.',
        
        // Confirmation Dialogs
        confirmDeleteDepartment: 'Are you sure you want to delete the department "{departmentName}"? This will also delete all positions in this department and their access permissions.',
        confirmDeletePosition: 'Are you sure you want to delete the position "{positionName}"? This will also delete all access permissions for this position.',
        confirmDeleteCategory: 'Are you sure you want to delete the category "{categoryName}"?',
        confirmDeleteSystem: 'Are you sure you want to delete the system "{systemName}"? This will also remove access to this system for all positions.',
        
        // Error Messages
        cannotDeleteCategoryWithSystems: 'Cannot delete category with systems. Please delete or reassign all systems first.',
        pleaseFillRequiredFields: 'Please fill in all required fields: Name, Department, and Position.',
        
        // Tooltips
        edit: 'Edit',
        delete: 'Delete'
      },
      es: {
        // App Title and Header
        appTitle: 'Gestor de Matriz de Acceso Hotelero',
        hotelAccessManager: 'Gestor de Acceso Hotelero',
        
        // Sidebar Navigation
        departmentsAndPositions: 'Departamentos y posiciones',
        systemsManagement: 'Gestión de Sistemas',
        formGenerator: 'Generador de Formularios',
        configuration: 'Configuración',
        
        // Departments Tab
        departments: 'Departamentos',
        searchDepartmentsOrPositions: '🔍 Buscar departamentos o posiciones...',
        addDepartment: '+ Agregar Departamento',
        noDepartmentsYet: 'Aún No Hay Departamentos',
        clickAddDepartmentToStart: 'Haz clic en "Agregar Departamento" para comenzar',
        positions: 'posiciones',
        
        // Positions Tab
        departmentPositions: '{departmentName} - Posiciones',
        addPosition: '+ Agregar Posición',
        noPositionsYet: 'Aún No Hay Posiciones',
        clickAddPositionToStart: 'Haz clic en "Agregar Posición" para agregar una posición a este departamento',
        
        // Access Matrix Tab
        accessManagement: 'Gestión de Acceso - {positionName}',
        
        // Systems Tab
        systemCategories: 'Categorías de Sistema',
        addCategory: '+ Agregar Categoría',
        noCategoriesYet: 'Aún No Hay Categorías',
        clickAddCategoryToStart: 'Haz clic en "Agregar Categoría" para comenzar',
        noSystems: 'Sin sistemas',
        add: '+ Agregar',
        
        // Form Generator Tab
        newEmployeeAccessForm: 'Formulario de Acceso de Nuevo Empleado',
        employeeName: 'Nombre del Empleado',
        enterFullName: 'Ingrese el nombre completo',
        idmLoginName: 'Nombre de Usuario IDM',
        enterIdmLoginName: 'Ingrese el nombre de usuario IDM',
        emailAccount: 'Cuenta de Correo',
        enterEmailAddress: 'Ingrese la dirección de correo',
        department: 'Departamento',
        selectDepartment: 'Seleccionar Departamento',
        position: 'Posición',
        selectPosition: 'Seleccionar Posición',
        startDate: 'Fecha de Inicio',
        generateForm: 'Generar Formulario',
        generatedForm: 'Formulario Generado',
        openForm: 'Abrir Formulario',
        viewAllForms: 'Ver Todos los Formularios',
        recentlyGeneratedForms: 'Formularios Generados Recientemente',
        noFormsGeneratedYet: 'Aún no se han generado formularios.',
        employee: 'Empleado',
        generated: 'Generado',
        actions: 'Acciones',
        open: 'Abrir',
        viewAllFormsCount: 'Ver Todos los {count} Formularios',
        
        // Configuration Tab
        formGenerationSettings: 'Configuración de Generación de Formularios',
        showOnlyCheckedSystems: 'Mostrar solo sistemas marcados en el formulario generado',
        showOnlyCheckedSystemsDescription: 'Cuando está habilitado, solo se mostrarán en el formulario generado los sistemas con permisos de acceso.',
        about: 'Acerca de',
        appVersion: 'Gestor de Acceso Waldorf v1.0.0',
        appDescription: 'Un sistema para gestionar el acceso de empleados a los sistemas y aplicaciones del hotel.',
        languageSettings: 'Configuración de Idioma',
        selectLanguage: 'Seleccionar Idioma',
        english: 'Inglés',
        spanish: 'Español',
        
        // Modal Titles
        addDepartmentTitle: 'Agregar Departamento',
        editDepartmentTitle: 'Editar Departamento',
        addPositionTitle: 'Agregar Posición',
        editPositionTitle: 'Editar Posición',
        addCategoryTitle: 'Agregar Categoría',
        editCategoryTitle: 'Editar Categoría',
        addSystemTitle: 'Agregar Sistema',
        editSystemTitle: 'Editar Sistema',
        
        // Form Labels
        departmentName: 'Nombre del Departamento',
        enterDepartmentName: 'Ingrese el nombre del departamento',
        positionName: 'Nombre de la Posición',
        enterPositionName: 'Ingrese el nombre de la posición',
        categoryName: 'Nombre de la Categoría',
        enterCategoryName: 'Ingrese el nombre de la categoría',
        systemName: 'Nombre del Sistema',
        enterSystemName: 'Ingrese el nombre del sistema',
        category: 'Categoría',
        
        // Buttons
        addDepartmentBtn: 'Agregar Departamento',
        updateDepartmentBtn: 'Actualizar Departamento',
        addPositionBtn: 'Agregar Posición',
        updatePositionBtn: 'Actualizar Posición',
        addCategoryBtn: 'Agregar Categoría',
        updateCategoryBtn: 'Actualizar Categoría',
        addSystemBtn: 'Agregar Sistema',
        updateSystemBtn: 'Actualizar Sistema',
        
        // Messages
        changesSavedAutomatically: '✓ Cambios guardados automáticamente',
        generatingForm: 'Generando formulario...',
        formGeneratedSuccessfully: '✅ ¡Formulario generado exitosamente!',
        file: 'Archivo',
        errorGeneratingForm: '❌ Error: {error}',
        noFormGeneratedYet: 'Aún no se ha generado ningún formulario.',
        errorLoadingFormsList: 'Error al cargar la lista de formularios.',
        
        // Confirmation Dialogs
        confirmDeleteDepartment: '¿Está seguro de que desea eliminar el departamento "{departmentName}"? Esto también eliminará todas las posiciones en este departamento y sus permisos de acceso.',
        confirmDeletePosition: '¿Está seguro de que desea eliminar la posición "{positionName}"? Esto también eliminará todos los permisos de acceso para esta posición.',
        confirmDeleteCategory: '¿Está seguro de que desea eliminar la categoría "{categoryName}"?',
        confirmDeleteSystem: '¿Está seguro de que desea eliminar el sistema "{systemName}"? Esto también eliminará el acceso a este sistema para todas las posiciones.',
        
        // Error Messages
        cannotDeleteCategoryWithSystems: 'No se puede eliminar una categoría con sistemas. Por favor, elimine o reasigne todos los sistemas primero.',
        pleaseFillRequiredFields: 'Por favor, complete todos los campos requeridos: Nombre, Departamento y Posición.',
        
        // Tooltips
        edit: 'Editar',
        delete: 'Eliminar'
      }
    };
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Set language
  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('language', lang);
      this.updateUI();
    }
  }

  // Get translation for a key
  t(key, params = {}) {
    const translation = this.translations[this.currentLanguage][key] || key;
    
    // Replace parameters in the translation
    let result = translation;
    Object.keys(params).forEach(param => {
      result = result.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    });
    
    return result;
  }

  // Update all UI elements with translations
  updateUI() {
    // Update document title
    document.title = this.t('appTitle');
    
    // Update HTML lang attribute
    document.documentElement.lang = this.currentLanguage;
    
    // Update all elements with data-i18n attribute
    const elementsWithI18n = document.querySelectorAll('[data-i18n]');
    elementsWithI18n.forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.t(key);
    });
    
    // Update all elements with data-i18n-placeholder attribute
    const elementsWithI18nPlaceholder = document.querySelectorAll('[data-i18n-placeholder]');
    elementsWithI18nPlaceholder.forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.setAttribute('placeholder', this.t(key));
    });
    
    // Update current tab content
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
      if (activeTab.id === 'departments') {
        this.updateDepartmentsTab();
      } else if (activeTab.id === 'systems') {
        this.updateSystemsTab();
      } else if (activeTab.id === 'formGenerator') {
        this.updateFormGeneratorTab();
      } else if (activeTab.id === 'configuration') {
        this.updateConfigurationTab();
      }
    }
    
    // Update modal if open
    const modal = document.getElementById('modal');
    if (modal && modal.classList.contains('active')) {
      this.updateModal();
    }
  }

  // Helper method to update element text
  updateElement(selector, key, params = {}) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = this.t(key, params);
    }
  }

  // Helper method to update element attribute
  updateElementAttribute(selector, attribute, key, params = {}) {
    const element = document.querySelector(selector);
    if (element) {
      element.setAttribute(attribute, this.t(key, params));
    }
  }

  // Update departments tab
  updateDepartmentsTab() {
    const departmentView = document.getElementById('departmentView');
    const positionView = document.getElementById('positionView');
    const accessView = document.getElementById('accessView');
    
    if (departmentView && departmentView.style.display !== 'none') {
      // Update empty state if present
      const emptyState = departmentView.querySelector('.empty-state h3');
      if (emptyState && emptyState.textContent.includes('No Departments') || emptyState.textContent.includes('Aún No Hay Departamentos')) {
        emptyState.textContent = this.t('noDepartmentsYet');
        const emptyStateP = departmentView.querySelector('.empty-state p');
        if (emptyStateP) emptyStateP.textContent = this.t('clickAddDepartmentToStart');
      }
    }
    
    if (positionView && positionView.style.display !== 'none') {
      // Update position view title
      const actionBar = positionView.querySelector('.action-bar h2');
      if (actionBar && currentDepartment) {
        actionBar.textContent = this.t('departmentPositions', { departmentName: currentDepartment.name });
      }
      
      // Update empty state if present
      const emptyState = positionView.querySelector('.empty-state h3');
      if (emptyState && (emptyState.textContent.includes('No Positions') || emptyState.textContent.includes('Aún No Hay Posiciones'))) {
        emptyState.textContent = this.t('noPositionsYet');
        const emptyStateP = positionView.querySelector('.empty-state p');
        if (emptyStateP) emptyStateP.textContent = this.t('clickAddPositionToStart');
      }
      
      // Update add position button
      const addPosBtn = positionView.querySelector('.action-bar button');
      if (addPosBtn && addPosBtn.textContent.includes('Add Position') || addPosBtn.textContent.includes('Agregar Posición')) {
        addPosBtn.textContent = this.t('addPosition');
      }
    }
    
    if (accessView && accessView.style.display !== 'none') {
      // Update access view title
      const actionBar = accessView.querySelector('.action-bar h2');
      if (actionBar && currentPosition) {
        actionBar.textContent = this.t('accessManagement', { positionName: currentPosition.name });
      }
    }
  }

  // Update systems tab
  updateSystemsTab() {
    const actionBar = document.querySelector('#systems .action-bar h2');
    if (actionBar) actionBar.textContent = this.t('systemCategories');
    
    const addCategoryBtn = document.querySelector('#systems .action-bar button');
    if (addCategoryBtn) addCategoryBtn.textContent = this.t('addCategory');
    
    // Update empty state if present
    const emptyState = document.querySelector('#systemsView .empty-state h3');
    if (emptyState && (emptyState.textContent.includes('No Categories') || emptyState.textContent.includes('Aún No Hay Categorías'))) {
      emptyState.textContent = this.t('noCategoriesYet');
      const emptyStateP = document.querySelector('#systemsView .empty-state p');
      if (emptyStateP) emptyStateP.textContent = this.t('clickAddCategoryToStart');
    }
    
    // Update "No systems" text
    const noSystemsElements = document.querySelectorAll('.category-manager p');
    noSystemsElements.forEach(el => {
      if (el.textContent.includes('No systems') || el.textContent.includes('Sin sistemas')) {
        el.textContent = this.t('noSystems');
      }
    });
    
    // Update add buttons
    const addBtns = document.querySelectorAll('.btn-success');
    addBtns.forEach(btn => {
      if (btn.textContent === '+ Add' || btn.textContent === '+ Agregar') {
        btn.textContent = this.t('add');
      }
    });
  }

  // Update form generator tab
  updateFormGeneratorTab() {
    const actionBar = document.querySelector('#formGenerator .action-bar h2');
    if (actionBar) actionBar.textContent = this.t('newEmployeeAccessForm');
    
    // Update form labels
    this.updateElement('label[for="empName"]', 'employeeName');
    this.updateElementAttribute('#empName', 'placeholder', 'enterFullName');
    this.updateElement('label[for="empOnQ"]', 'idmLoginName');
    this.updateElementAttribute('#empOnQ', 'placeholder', 'enterIdmLoginName');
    this.updateElement('label[for="empMail"]', 'emailAccount');
    this.updateElementAttribute('#empMail', 'placeholder', 'enterEmailAddress');
    this.updateElement('label[for="empDept"]', 'department');
    this.updateElement('#empDept option:first-child', 'selectDepartment');
    this.updateElement('label[for="empPos"]', 'position');
    this.updateElement('#empPos option:first-child', 'selectPosition');
    this.updateElement('label[for="empDate"]', 'startDate');
    
    // Update buttons
    this.updateElement('button[onclick="generateForm()"]', 'generateForm');
    
    // Update generated form section
    this.updateElement('#formOutput h3', 'generatedForm');
    this.updateElement('button[onclick="openGeneratedForm()"]', 'openForm');
    this.updateElement('button[onclick="openFormsIndex()"]', 'viewAllForms');
    
    // Update recently generated forms section
    this.updateElement('#generatedFormsList h3', 'recentlyGeneratedForms');
    
    // Update table headers
    const tableHeaders = document.querySelectorAll('#formsListContent th');
    if (tableHeaders.length >= 4) {
      tableHeaders[0].textContent = this.t('employee');
      tableHeaders[1].textContent = this.t('department');
      tableHeaders[2].textContent = this.t('position');
      tableHeaders[3].textContent = this.t('generated');
      tableHeaders[4].textContent = this.t('actions');
    }
    
    // Update open buttons in table
    const openBtns = document.querySelectorAll('#formsListContent button[onclick*="openGeneratedFile"]');
    openBtns.forEach(btn => {
      if (btn.textContent === 'Open' || btn.textContent === 'Abrir') {
        btn.textContent = this.t('open');
      }
    });
    
    // Update view all forms button
    const viewAllBtns = document.querySelectorAll('button[onclick="openFormsIndex()"]');
    viewAllBtns.forEach(btn => {
      if (btn.textContent.includes('View All') || btn.textContent.includes('Ver Todos')) {
        const countMatch = btn.textContent.match(/\d+/);
        if (countMatch) {
          btn.textContent = this.t('viewAllFormsCount', { count: countMatch[0] });
        } else {
          btn.textContent = this.t('viewAllForms');
        }
      }
    });
  }

  // Update configuration tab
  updateConfigurationTab() {
    // Update form generation settings section
    this.updateElement('#configurationView .config-module:first-child h3', 'formGenerationSettings');
    this.updateElement('label[for="onlyCheckedSystems"]', 'showOnlyCheckedSystems');
    this.updateElement('#configurationView .config-module:first-child p', 'showOnlyCheckedSystemsDescription');
    
    // Update about section
    this.updateElement('#configurationView .config-module:last-child h3', 'about');
    
    // Update language settings section
    const langSettingsTitle = document.querySelector('#configurationView .config-module:nth-child(2) h3');
    if (langSettingsTitle) langSettingsTitle.textContent = this.t('languageSettings');
    
    const langLabel = document.querySelector('label[for="languageSelect"]');
    if (langLabel) langLabel.textContent = this.t('selectLanguage');
  }

  // Update modal content
  updateModal() {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modalTitle || !modalBody) return;
    
    // Update modal title based on content
    const titleText = modalTitle.textContent;
    if (titleText.includes('Add Department') || titleText.includes('Agregar Departamento')) {
      modalTitle.textContent = this.t('addDepartmentTitle');
    } else if (titleText.includes('Edit Department') || titleText.includes('Editar Departamento')) {
      modalTitle.textContent = this.t('editDepartmentTitle');
    } else if (titleText.includes('Add Position') || titleText.includes('Agregar Posición')) {
      modalTitle.textContent = this.t('addPositionTitle');
    } else if (titleText.includes('Edit Position') || titleText.includes('Editar Posición')) {
      modalTitle.textContent = this.t('editPositionTitle');
    } else if (titleText.includes('Add Category') || titleText.includes('Agregar Categoría')) {
      modalTitle.textContent = this.t('addCategoryTitle');
    } else if (titleText.includes('Edit Category') || titleText.includes('Editar Categoría')) {
      modalTitle.textContent = this.t('editCategoryTitle');
    } else if (titleText.includes('Add System') || titleText.includes('Agregar Sistema')) {
      modalTitle.textContent = this.t('addSystemTitle');
    } else if (titleText.includes('Edit System') || titleText.includes('Editar Sistema')) {
      modalTitle.textContent = this.t('editSystemTitle');
    }
    
    // Update form labels in modal
    const labels = modalBody.querySelectorAll('label');
    labels.forEach(label => {
      const labelText = label.textContent;
      if (labelText.includes('Department Name') || labelText.includes('Nombre del Departamento')) {
        label.textContent = this.t('departmentName');
      } else if (labelText.includes('Position Name') || labelText.includes('Nombre de la Posición')) {
        label.textContent = this.t('positionName');
      } else if (labelText.includes('Category Name') || labelText.includes('Nombre de la Categoría')) {
        label.textContent = this.t('categoryName');
      } else if (labelText.includes('System Name') || labelText.includes('Nombre del Sistema')) {
        label.textContent = this.t('systemName');
      } else if (labelText === 'Category' || labelText === 'Categoría') {
        label.textContent = this.t('category');
      }
    });
    
    // Update placeholders
    const inputs = modalBody.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
      const placeholder = input.getAttribute('placeholder');
      if (placeholder && placeholder.includes('Enter department name') || placeholder && placeholder.includes('Ingrese el nombre del departamento')) {
        input.setAttribute('placeholder', this.t('enterDepartmentName'));
      } else if (placeholder && placeholder.includes('Enter position name') || placeholder && placeholder.includes('Ingrese el nombre de la posición')) {
        input.setAttribute('placeholder', this.t('enterPositionName'));
      } else if (placeholder && placeholder.includes('Enter category name') || placeholder && placeholder.includes('Ingrese el nombre de la categoría')) {
        input.setAttribute('placeholder', this.t('enterCategoryName'));
      } else if (placeholder && placeholder.includes('Enter system name') || placeholder && placeholder.includes('Ingrese el nombre del sistema')) {
        input.setAttribute('placeholder', this.t('enterSystemName'));
      }
    });
    
    // Update buttons
    const buttons = modalBody.querySelectorAll('button');
    buttons.forEach(button => {
      const buttonText = button.textContent;
      if (buttonText.includes('Add Department') || buttonText.includes('Agregar Departamento')) {
        button.textContent = this.t('addDepartmentBtn');
      } else if (buttonText.includes('Update Department') || buttonText.includes('Actualizar Departamento')) {
        button.textContent = this.t('updateDepartmentBtn');
      } else if (buttonText.includes('Add Position') || buttonText.includes('Agregar Posición')) {
        button.textContent = this.t('addPositionBtn');
      } else if (buttonText.includes('Update Position') || buttonText.includes('Actualizar Posición')) {
        button.textContent = this.t('updatePositionBtn');
      } else if (buttonText.includes('Add Category') || buttonText.includes('Agregar Categoría')) {
        button.textContent = this.t('addCategoryBtn');
      } else if (buttonText.includes('Update Category') || buttonText.includes('Actualizar Categoría')) {
        button.textContent = this.t('updateCategoryBtn');
      } else if (buttonText.includes('Add System') || buttonText.includes('Agregar Sistema')) {
        button.textContent = this.t('addSystemBtn');
      } else if (buttonText.includes('Update System') || buttonText.includes('Actualizar Sistema')) {
        button.textContent = this.t('updateSystemBtn');
      }
    });
    
    // Update tooltips
    const editBtns = modalBody.querySelectorAll('button[title*="Edit"], button[title*="Editar"]');
    editBtns.forEach(btn => {
      btn.setAttribute('title', this.t('edit'));
    });
    
    const deleteBtns = modalBody.querySelectorAll('button[title*="Delete"], button[title*="Eliminar"]');
    deleteBtns.forEach(btn => {
      btn.setAttribute('title', this.t('delete'));
    });
  }
}

// Create global translation service instance
const translationService = new TranslationService();

// Make it globally accessible
window.translationService = translationService;
window.t = (key, params) => translationService.t(key, params);