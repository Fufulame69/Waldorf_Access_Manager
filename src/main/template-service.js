const fs = require('fs').promises;
const path = require('path');
const PDFConverterService = require('./pdf-converter-service');
const CleanupService = require('./cleanup-service');

/**
 * Service for hydrating HTML templates with user data and permissions
 */
class TemplateService {
  constructor() {
    this.templatePath = path.join(__dirname, '../templates/solicitud_template.html');
    this.checklistTemplatePath = path.join(__dirname, '../templates/checklist_template.html');
    this.pdfConverter = new PDFConverterService();
    this.cleanupService = new CleanupService();
  }

  /**
   * Read the HTML template file
   * @param {string} templateType - Type of template to read ('solicitud' or 'checklist')
   * @returns {Promise<string>} The template content
   */
  async readTemplate(templateType = 'solicitud') {
    try {
      const templatePath = templateType === 'checklist' ? this.checklistTemplatePath : this.templatePath;
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      console.error('Error reading template:', error);
      throw new Error('Failed to read template file');
    }
  }

  /**
   * Get user permissions based on department and position
   * @param {Object} data - The complete database data
   * @param {string} departmentName - The department name
   * @param {string} positionName - The position name
   * @returns {Object} Object with system IDs as keys and boolean values
   */
  getUserPermissions(data, departmentName, positionName) {
    // Find the department
    const department = data.departments.find(dept => dept.name === departmentName);
    if (!department) {
      console.warn(`Department not found: ${departmentName}`);
      return {};
    }

    // Find the position within the department
    const position = department.positions.find(pos => pos.name === positionName);
    if (!position) {
      console.warn(`Position not found: ${positionName} in department ${departmentName}`);
      return {};
    }

    // Get the access matrix key
    const positionKey = `${department.id}-${position.id}`;
    return data.accessMatrix[positionKey] || {};
  }

  /**
   * Create a mapping of system names to their checkbox IDs
   * @param {Object} data - The complete database data
   * @returns {Map} Map of system names to checkbox IDs
   */
  createSystemNameToIdMap(data) {
    const nameToIdMap = new Map();
    
    // Add all systems with their dynamically generated checkbox IDs
    data.systems.forEach(system => {
      // Generate checkbox ID the same way as in generateDynamicSystemSections
      const checkboxId = system.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      
      nameToIdMap.set(system.name, system.id);
      nameToIdMap.set(checkboxId, system.id);
    });

    return nameToIdMap;
  }

  /**
   * Generate dynamic HTML sections for systems based on database categories and systems
   * @param {Object} data - The complete database data
   * @param {Object} permissions - User permissions object (optional)
   * @param {boolean} onlyChecked - Whether to only show checked systems (optional)
   * @returns {string} HTML string for all system sections
   */
  generateDynamicSystemSections(data, permissions = {}, onlyChecked = false) {
    // Group systems by category
    const categorizedSystems = {};
    data.systems.forEach(system => {
      const category = data.categories.find(cat => cat.id === system.categoryId);
      const categoryName = category ? category.name : 'Uncategorized';
      
      if (!categorizedSystems[categoryName]) {
        categorizedSystems[categoryName] = [];
      }
      categorizedSystems[categoryName].push(system);
    });

    // Generate HTML for each category
    let sectionsHtml = '';
    
    Object.entries(categorizedSystems).forEach(([categoryName, systems]) => {
      // Filter systems if onlyChecked is true
      let filteredSystems = systems;
      if (onlyChecked) {
        filteredSystems = systems.filter(system => {
          // Check both string and numeric keys for permissions
          return permissions[system.id] === true ||
                 permissions[String(system.id)] === true ||
                 permissions[system.id] === 'true' ||
                 permissions[String(system.id)] === 'true';
        });
      }
      
      // Skip categories with no systems after filtering
      if (filteredSystems.length === 0) return;
      
      // Generate checkbox ID for each system (lowercase, replace special chars)
      const systemCheckboxes = filteredSystems.map(system => {
        const checkboxId = system.name.toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        
        return `<div class="flex items-center">
          <input type="checkbox" id="${checkboxId}" name="permissions" value="${system.name}" style="margin-right: var(--space-1);">
          <label for="${checkboxId}">${system.name}</label>
        </div>`;
      }).join('\n                        ');

      // Use flexbox for responsive layout that flows horizontally then wraps
      let gridClass = 'flex flex-wrap';

      sectionsHtml += `
                <!-- ${categoryName.toUpperCase()} Section -->
                <div class="border border-gray-300" style="border-radius: var(--radius-md);">
                    <h4 class="bg-blue-900 text-white text-center font-bold rounded-t-md" style="padding-top: var(--space-0-5); padding-bottom: var(--space-0-5); font-size: var(--text-section-header);">${categoryName.toUpperCase()}</h4>
                    <div class="${gridClass}" style="padding: var(--space-1-5); column-gap: var(--space-1); row-gap: var(--space-0-5); font-size: var(--text-checkbox);">
                        ${systemCheckboxes}
                    </div>
                </div>`;
    });

    return sectionsHtml;
  }

  /**
   * Generate dynamic HTML sections for checklist template based on database categories and systems
   * @param {Object} data - The complete database data
   * @param {Object} permissions - User permissions object
   * @returns {string} HTML string for checklist system sections
   */
  generateChecklistSystemSections(data, permissions = {}) {
    // Group systems by category
    const categorizedSystems = {};
    data.systems.forEach(system => {
      const category = data.categories.find(cat => cat.id === system.categoryId);
      const categoryName = category ? category.name : 'Uncategorized';
      
      if (!categorizedSystems[categoryName]) {
        categorizedSystems[categoryName] = [];
      }
      categorizedSystems[categoryName].push(system);
    });

    // Generate HTML for each category
    let sectionsHtml = '';
    
    Object.entries(categorizedSystems).forEach(([categoryName, systems]) => {
      // Filter systems to only show those with permissions
      const filteredSystems = systems.filter(system => {
        // Check both string and numeric keys for permissions
        return permissions[system.id] === true ||
               permissions[String(system.id)] === true ||
               permissions[system.id] === 'true' ||
               permissions[String(system.id)] === 'true';
      });
      
      // Skip categories with no systems after filtering
      if (filteredSystems.length === 0) return;
      
      // Generate checkbox rows for each system
      const systemRows = filteredSystems.map(system => {
        const checkboxId = system.name.toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        
        return `
                        <!-- System Row -->
                        <tr>
                            <td class="px-4 py-6 whitespace-nowrap font-medium text-gray-900" style="font-size: var(--text-form-label);">
                                ${system.name}
                            </td>
                            <td class="px-4 py-6 whitespace-nowrap border-l-2 border-gray-400">
                                <label class="flex items-center justify-center">
                                    <input type="checkbox" style="height: var(--checkbox-size); width: var(--checkbox-size);" class="text-blue-600 border-gray-400 rounded" checked>
                                </label>
                            </td>
                            <td class="px-2 py-6 border-l-2 border-gray-400">
                                <!-- Anotaciones section without textbox -->
                            </td>
                        </tr>`;
      }).join('');

      sectionsHtml += `
                        <!-- ${categoryName.toUpperCase()} Section -->
                        <tr>
                            <td colspan="3" class="bg-gray-100 font-bold text-center px-4 py-2" style="font-size: var(--text-section-header);">
                                ${categoryName.toUpperCase()}
                            </td>
                        </tr>
                        ${systemRows}`;
    });

    return sectionsHtml;
  }

  /**
   * Hydrate the template with user data and permissions
   * @param {Object} data - The complete database data
   * @param {Object} userData - User information
   * @param {string} userData.name - User name
   * @param {string} userData.position - User position
   * @param {string} userData.department - User department
   * @param {string} userData.email - User email
   * @param {string} userData.idmLogin - IDM login
   * @param {string} userData.startDate - Start date
   * @param {Object} options - Configuration options
   * @param {boolean} options.onlyCheckedSystems - Whether to only show checked systems
   * @param {string} options.templateType - Type of template to hydrate ('solicitud' or 'checklist')
   * @returns {Promise<string>} The hydrated HTML content
   */
  async hydrateTemplate(data, userData, options = {}) {
    const templateType = options.templateType || 'solicitud';
    let template = await this.readTemplate(templateType);
    
    // Get user permissions
    const permissions = this.getUserPermissions(data, userData.department, userData.position);
    const systemNameToIdMap = this.createSystemNameToIdMap(data);

    if (templateType === 'checklist') {
      // Generate checklist system sections (only show checked systems)
      const checklistSections = this.generateChecklistSystemSections(data, permissions);
      
      // Replace the placeholder in checklist template
      template = template.replace(
        /<!-- System Row 1 -->[\s\S]*?<!-- System Row 10 -->[\s\S]*?<\/tr>/,
        checklistSections
      );
      
      // Replace user information fields in checklist template
      template = template.replace('id="nombre"', `id="nombre" value="${userData.name || ''}"`);
      template = template.replace('id="posicion"', `id="posicion" value="${userData.position || ''}"`);
      template = template.replace('id="departamento"', `id="departamento" value="${userData.department || ''}"`);
      template = template.replace('id="fecha_ingreso"', `id="fecha_ingreso" value="${userData.startDate || ''}"`);
    } else {
      // Generate dynamic system sections with optional filtering
      const dynamicSections = this.generateDynamicSystemSections(
        data,
        permissions,
        options.onlyCheckedSystems || false
      );

      // Replace the placeholder for system sections with dynamic content
      template = template.replace(
        '<!-- DYNAMIC_SYSTEM_SECTIONS_PLACEHOLDER -->',
        dynamicSections
      );
      
      // Replace user information fields in solicitud template
      template = template.replace('id="nombre"', `id="nombre" value="${userData.name || ''}"`);
      template = template.replace('id="posicion"', `id="posicion" value="${userData.position || ''}"`);
      template = template.replace('id="departamento"', `id="departamento" value="${userData.department || ''}"`);
      template = template.replace('value="19-Jul-24"', `value="${userData.startDate || ''}"`);
      template = template.replace('id="idm_login"', `id="idm_login" value="${userData.idmLogin || ''}"`);
      template = template.replace('id="email"', `id="email" value="${userData.email || ''}"`);
      
      // Replace the user name in the acknowledgment section
      template = template.replace(
        'Yo, ___, he entendido',
        `Yo, ${userData.name || '___'}, he entendido`
      );
    }


    // Check/uncheck checkboxes based on permissions
    // Find all checkbox inputs in the template
    const checkboxRegex = /<input[^>]*type="checkbox"[^>]*>/g;
    
    template = template.replace(checkboxRegex, (match) => {
      // Extract the id attribute from the checkbox
      const idMatch = match.match(/id="([^"]+)"/);
      if (!idMatch) return match;

      const checkboxId = idMatch[1];
      const systemId = systemNameToIdMap.get(checkboxId);
      
      // Check both string and numeric keys for permissions
      const hasPermission = systemId && (
        permissions[systemId] === true ||
        permissions[String(systemId)] === true ||
        permissions[systemId] === 'true' ||
        permissions[String(systemId)] === 'true'
      );
      
      if (hasPermission) {
        // Add checked attribute if user has permission
        return match.replace('<input', '<input checked');
      }
      
      return match;
    });

    return template;
  }

  /**
   * Generate form files and save them to employee-specific folders
   * @param {Object} data - The complete database data
   * @param {Object} userData - User information
   * @param {string} outputDir - Output directory path
   * @param {Object} options - Configuration options
   * @param {boolean} options.onlyCheckedSystems - Whether to only show checked systems
   * @param {boolean} options.generatePDF - Whether to generate PDF instead of HTML (default: true)
   * @returns {Promise<Object>} Object with paths to generated files
   */
  async generateForm(data, userData, outputDir = './generated-forms', options = {}) {
    try {
      // Create output directory if it doesn't exist
      await fs.mkdir(outputDir, { recursive: true });

      // Generate employee folder name based on user name
      const sanitizedName = (userData.name || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
      const employeeFolder = path.join(outputDir, sanitizedName);
      await fs.mkdir(employeeFolder, { recursive: true });

      // Generate timestamp for filenames
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Default to PDF generation unless explicitly disabled
      const generatePDF = options.generatePDF !== false;
      const fileExtension = generatePDF ? '.pdf' : '.html';
      
      const results = {};

      // Generate solicitud form
      const solicitudOptions = { ...options, templateType: 'solicitud' };
      const solicitudBaseFilename = `solicitud_${timestamp}`;
      const solicitudFilename = `${solicitudBaseFilename}${fileExtension}`;
      const solicitudFilePath = path.join(employeeFolder, solicitudFilename);
      
      let solicitudContent = await this.hydrateTemplate(data, userData, solicitudOptions);

      if (generatePDF) {
        // For PDF generation, we need to convert relative image paths to absolute paths
        const logoPath = path.resolve(__dirname, '../../assets/waldorf_logo.png');
        const logoBase64 = await this.imageToBase64(logoPath);
        solicitudContent = solicitudContent.replace(
          '../assets/waldorf_logo.png',
          `data:image/png;base64,${logoBase64}`
        );

        // Convert HTML to PDF
        await this.pdfConverter.convertHTMLToPDF(solicitudContent, solicitudFilePath, {
          format: 'Letter',
          printBackground: true,
          margin: {
            top: '0.3cm',
            right: '0.3cm',
            bottom: '0.3cm',
            left: '0.3cm'
          }
        });
        
        // Also save the HTML file for reference
        const solicitudHtmlFilePath = path.join(employeeFolder, `${solicitudBaseFilename}.html`);
        await fs.writeFile(solicitudHtmlFilePath, solicitudContent, 'utf8');
        
        // Schedule cleanup of the HTML file after PDF generation
        this.cleanupService.cleanupAfterPDFGeneration(solicitudFilePath, {
          delay: 3000,
          deleteIndex: false
        });
        
        console.log(`PDF solicitud form generated successfully: ${solicitudFilePath}`);
      } else {
        // Write the HTML file
        await fs.writeFile(solicitudFilePath, solicitudContent, 'utf8');
        console.log(`HTML solicitud form generated successfully: ${solicitudFilePath}`);
      }

      results.solicitud = solicitudFilePath;

      // Generate checklist form
      const checklistOptions = { ...options, templateType: 'checklist' };
      const checklistBaseFilename = `checklist_${timestamp}`;
      const checklistFilename = `${checklistBaseFilename}${fileExtension}`;
      const checklistFilePath = path.join(employeeFolder, checklistFilename);
      
      let checklistContent = await this.hydrateTemplate(data, userData, checklistOptions);

      if (generatePDF) {
        // For PDF generation, we need to convert relative image paths to absolute paths
        const logoPath = path.resolve(__dirname, '../../assets/waldorf_logo.png');
        const logoBase64 = await this.imageToBase64(logoPath);
        checklistContent = checklistContent.replace(
          '../../assets/waldorf_logo.png',
          `data:image/png;base64,${logoBase64}`
        );

        // Convert HTML to PDF
        await this.pdfConverter.convertHTMLToPDF(checklistContent, checklistFilePath, {
          format: 'Letter',
          printBackground: true,
          margin: {
            top: '0.3cm',
            right: '0.3cm',
            bottom: '0.3cm',
            left: '0.3cm'
          }
        });
        
        // Also save the HTML file for reference
        const checklistHtmlFilePath = path.join(employeeFolder, `${checklistBaseFilename}.html`);
        await fs.writeFile(checklistHtmlFilePath, checklistContent, 'utf8');
        
        // Schedule cleanup of the HTML file after PDF generation
        this.cleanupService.cleanupAfterPDFGeneration(checklistFilePath, {
          delay: 3000,
          deleteIndex: false
        });
        
        console.log(`PDF checklist form generated successfully: ${checklistFilePath}`);
      } else {
        // Write the HTML file
        await fs.writeFile(checklistFilePath, checklistContent, 'utf8');
        console.log(`HTML checklist form generated successfully: ${checklistFilePath}`);
      }

      results.checklist = checklistFilePath;
      results.employeeFolder = employeeFolder;

      return results;
    } catch (error) {
      console.error('Error generating form:', error);
      throw new Error(`Failed to generate form: ${error.message}`);
    }
  }

  /**
   * Convert an image file to base64 string
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<string>} Base64 encoded image
   */
  async imageToBase64(imagePath) {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      return imageBuffer.toString('base64');
    } catch (error) {
      console.warn('Could not convert image to base64:', error);
      return '';
    }
  }

  /**
   * Generate an index file listing all generated forms
   * @param {Array} forms - Array of form objects with name, path, and generation date
   * @param {string} outputDir - Output directory path
   * @returns {Promise<string>} Path to the generated index file
   */
  async generateIndex(forms, outputDir = './generated-forms') {
    try {
      const indexPath = path.join(outputDir, 'index.html');
      
      // Group forms by employee
      const formsByEmployee = {};
      forms.forEach(form => {
        if (!formsByEmployee[form.name]) {
          formsByEmployee[form.name] = [];
        }
        formsByEmployee[form.name].push(form);
      });

      const indexContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formularios Generados - Waldorf Access Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .employee-folder { border-left: 4px solid #3b82f6; }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Formularios Generados</h1>
                    <p class="text-gray-600 mt-2">Solicitudes de Acceso a Sistemas - Waldorf Hotel</p>
                </div>
                <img src="../assets/waldorf_logo.png" alt="Waldorf Logo" class="h-16">
            </div>
        </header>

        <main>
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-semibold mb-4">Lista de Formularios por Empleado</h2>
                ${forms.length === 0 ?
                    '<p class="text-gray-500">No hay formularios generados aún.</p>' :
                    `<div class="space-y-6">
                        ${Object.entries(formsByEmployee).map(([employeeName, employeeForms]) => {
                            const sortedForms = employeeForms.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
                            const latestForm = sortedForms[0];
                            const sanitizedName = (employeeName || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
                            
                            return `
                            <div class="employee-folder bg-gray-50 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <h3 class="text-lg font-semibold text-gray-900">${employeeName}</h3>
                                    <button onclick="window.open('${sanitizedName}/', '_blank')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                                        Abrir Carpeta
                                    </button>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm text-gray-600 mb-2">Departamento: ${latestForm.department} | Posición: ${latestForm.position}</p>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        ${sortedForms.map(form => {
                                            const isPDF = form.filename.endsWith('.pdf');
                                            const linkText = isPDF ? 'Ver PDF' : 'Ver HTML';
                                            const linkClass = isPDF ? 'text-red-600 hover:text-red-900' : 'text-blue-600 hover:text-blue-900';
                                            const typeText = form.type === 'checklist' ? 'Checklist' : 'Solicitud';
                                            const typeClass = form.type === 'checklist' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
                                            
                                            return `
                                            <div class="flex items-center justify-between p-2 bg-white rounded border">
                                                <div class="flex items-center space-x-2">
                                                    <span class="px-2 py-1 text-xs rounded-full ${typeClass}">${typeText}</span>
                                                    <a href="${form.filename}" target="_blank" class="${linkClass} text-sm font-medium">${linkText}</a>
                                                    ${isPDF ? `<span class="text-xs text-gray-500">(PDF)</span>` : ''}
                                                </div>
                                                <span class="text-xs text-gray-500">${new Date(form.generatedAt).toLocaleDateString('es-CR')}</span>
                                            </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>`
                }
            </div>
        </main>

        <footer class="mt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2024 Waldorf Hotel - Sistema de Gestión de Accesos</p>
        </footer>
    </div>
</body>
</html>`;

      await fs.writeFile(indexPath, indexContent, 'utf8');
      console.log(`Index generated successfully: ${indexPath}`);
      return indexPath;
    } catch (error) {
      console.error('Error generating index:', error);
      throw new Error(`Failed to generate index: ${error.message}`);
    }
  }
  /**
   * Clean up leftover HTML files in the generated forms directory
   * @param {string} outputDir - Output directory path (default: './generated-forms')
   * @param {Object} options - Cleanup options
   * @returns {Promise<void>}
   */
  async cleanupLeftoverFiles(outputDir = './generated-forms', options = {}) {
    await this.cleanupService.cleanupAllHTMLFiles(outputDir, options);
  }

  /**
   * Clean up old files in the generated forms directory
   * @param {string} outputDir - Output directory path (default: './generated-forms')
   * @param {Object} options - Cleanup options
   * @returns {Promise<void>}
   */
  async cleanupOldFiles(outputDir = './generated-forms', options = {}) {
    await this.cleanupService.cleanupOldFiles(outputDir, options);
  }

  /**
   * Close the PDF converter service
   * Should be called when the application is closing
   */
  async close() {
    await this.pdfConverter.close();
  }
}

module.exports = TemplateService;