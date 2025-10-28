const fs = require('fs').promises;
const path = require('path');
const PDFConverterService = require('./pdf-converter-service');

/**
 * Service for hydrating HTML templates with user data and permissions
 */
class TemplateService {
  constructor() {
    this.templatePath = path.join(__dirname, '../templates/solicitud_template.html');
    this.pdfConverter = new PDFConverterService();
  }

  /**
   * Read the HTML template file
   * @returns {Promise<string>} The template content
   */
  async readTemplate() {
    try {
      return await fs.readFile(this.templatePath, 'utf8');
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
        filteredSystems = systems.filter(system => permissions[system.id] === true);
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
   * @returns {Promise<string>} The hydrated HTML content
   */
  async hydrateTemplate(data, userData, options = {}) {
    let template = await this.readTemplate();
    
    // Get user permissions
    const permissions = this.getUserPermissions(data, userData.department, userData.position);
    const systemNameToIdMap = this.createSystemNameToIdMap(data);

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

    // Replace user information fields
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

    // Check/uncheck checkboxes based on permissions
    // Find all checkbox inputs in the template
    const checkboxRegex = /<input[^>]*type="checkbox"[^>]*>/g;
    
    template = template.replace(checkboxRegex, (match) => {
      // Extract the id attribute from the checkbox
      const idMatch = match.match(/id="([^"]+)"/);
      if (!idMatch) return match;

      const checkboxId = idMatch[1];
      const systemId = systemNameToIdMap.get(checkboxId);
      
      if (systemId && permissions[systemId]) {
        // Add checked attribute if user has permission
        return match.replace('<input', '<input checked');
      }
      
      return match;
    });

    return template;
  }

  /**
   * Generate a form file and save it to the output directory
   * @param {Object} data - The complete database data
   * @param {Object} userData - User information
   * @param {string} outputDir - Output directory path
   * @param {Object} options - Configuration options
   * @param {boolean} options.onlyCheckedSystems - Whether to only show checked systems
   * @param {boolean} options.generatePDF - Whether to generate PDF instead of HTML (default: true)
   * @returns {Promise<string>} Path to the generated file
   */
  async generateForm(data, userData, outputDir = './generated-forms', options = {}) {
    try {
      // Create output directory if it doesn't exist
      await fs.mkdir(outputDir, { recursive: true });

      // Generate filename based on user name and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedName = (userData.name || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
      const baseFilename = `solicitud_${sanitizedName}_${timestamp}`;
      
      // Default to PDF generation unless explicitly disabled
      const generatePDF = options.generatePDF !== false;
      const fileExtension = generatePDF ? '.pdf' : '.html';
      const filename = `${baseFilename}${fileExtension}`;
      const filePath = path.join(outputDir, filename);

      // Hydrate the template with options
      let hydratedContent = await this.hydrateTemplate(data, userData, options);

      if (generatePDF) {
        // For PDF generation, we need to convert relative image paths to absolute paths
        const logoPath = path.resolve(__dirname, '../../assets/waldorf_logo.png');
        const logoBase64 = await this.imageToBase64(logoPath);
        hydratedContent = hydratedContent.replace(
          '../assets/waldorf_logo.png',
          `data:image/png;base64,${logoBase64}`
        );

        // Convert HTML to PDF
        await this.pdfConverter.convertHTMLToPDF(hydratedContent, filePath, {
          format: 'Letter',
          printBackground: true,
          margin: {
            top: '0.3cm',
            right: '0.3cm',
            bottom: '0.3cm',
            left: '0.3cm'
          }
        });
        
        // Also save the HTML file for reference (optional)
        const htmlFilePath = path.join(outputDir, `${baseFilename}.html`);
        await fs.writeFile(htmlFilePath, hydratedContent, 'utf8');
        
        console.log(`PDF form generated successfully: ${filePath}`);
      } else {
        // Write the HTML file
        await fs.writeFile(filePath, hydratedContent, 'utf8');
        console.log(`HTML form generated successfully: ${filePath}`);
      }

      return filePath;
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
                <h2 class="text-xl font-semibold mb-4">Lista de Formularios</h2>
                ${forms.length === 0 ?
                    '<p class="text-gray-500">No hay formularios generados aún.</p>' :
                    `<div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Generación</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${forms.map(form => {
                                    const isPDF = form.filename.endsWith('.pdf');
                                    const linkText = isPDF ? 'Ver PDF' : 'Ver Formulario';
                                    const linkClass = isPDF ? 'text-red-600 hover:text-red-900' : 'text-blue-600 hover:text-blue-900';
                                    
                                    return `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${form.name}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${form.department}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${form.position}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(form.generatedAt).toLocaleString('es-CR')}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <a href="${form.filename}" target="_blank" class="${linkClass}">${linkText}</a>
                                            ${isPDF ? `<span class="ml-2 text-xs text-gray-500">(PDF)</span>` : ''}
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
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
   * Close the PDF converter service
   * Should be called when the application is closing
   */
  async close() {
    await this.pdfConverter.close();
  }
}

module.exports = TemplateService;