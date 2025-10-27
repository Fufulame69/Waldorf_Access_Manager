const fs = require('fs').promises;
const path = require('path');

/**
 * Service for hydrating HTML templates with user data and permissions
 */
class TemplateService {
  constructor() {
    this.templatePath = path.join(__dirname, '../templates/solicitud_template.html');
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
    
    // Add all systems with their checkbox IDs
    data.systems.forEach(system => {
      // Convert system name to lowercase and replace spaces/special chars for matching
      const normalizedName = system.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      nameToIdMap.set(system.name, system.id);
      nameToIdMap.set(normalizedName, system.id);
    });

    // Add hardcoded mappings for template checkboxes that don't match system names exactly
    const hardcodedMappings = {
      'ar_clerk': 12,
      'ar_manager': 10,
      'bell_man': 19,
      'concierge': 18,
      'fd_agent': 17,
      'fd_supervisor': 16,
      'income_auditor': 11,
      'finance_manager': 7,
      'finance_supervisor': 9,
      'fo_manager': 13,
      'groups_ce_manager': 26,
      'housekeeping_attend': 22,
      'executive_housekeeper': 20,
      'housekeeping_supervisor': 21,
      'ism': 31,
      'night_auditor': 14,
      'night_manager': 15,
      'opera_supervisor': 33,
      'reservation_agent': 25,
      'revenue_manager': 23,
      'reservation_supervisor': 24,
      'sales': 28,
      'sales_manager': 27,
      'security': 8,
      'telephone_operator': 30,
      'telephone_supervisor': 29,
      'onq_ri': 5,
      'sun': 71,
      'bmqa': 72,
      'proplan': 76,
      'operations_audit': 73,
      'blackline': 75,
      'datalink': 74,
      'fms': 77,
      'recepcion': 79,
      'finanzas': 78,
      'administrador': 80,
      'general_manager': 34,
      'po_req_selectdepts': 39,
      'director_of_finance': 35,
      'po_aprv_req_selectdepts': 40,
      'accounts_payable': 36,
      'it_manager': 41,
      'dir_of_pur': 37,
      'po_req_selectdepts_recv_aprv': 42,
      'storeroom_receiver': 38,
      'cost_controller_accounts_payable': 43,
      'administrador_monolith': 57,
      'gerente_reg_acciones': 58,
      'gerente_reloj_marcador': 59,
      'emc': 60,
      'reporting_analytics': 61,
      'tarjeta_pos': 62,
      'server': 63,
      'bartender': 64,
      'in_room_dining': 65,
      'cashier': 66,
      'cashier_discount': 67,
      'supervisor_symphony': 68,
      'manager_symphony': 69,
      'property_expert': 70,
      'sinergy_mms': 101,
      'avero': 81,
      'vantage': 102,
      'delphi': 103,
      'cloudflare': 100,
      'reports': 99,
      'op_audit': 98,
      'vision_line': 97,
      'opentable': 96,
      'book4time': 95,
      'sertify': 94,
      'pressreader': 93,
      'zennio': 92,
      'bms': 91,
      'owner_rlt': 90,
      'foxit': 89,
      'adobe': 88,
      'alice': 87,
      'wiq': 86,
      'kypsu': 85,
      'trayaway': 84,
      'kualtrix': 83,
      'synergymms': 82,
      'cb': 109,
      'eng': 104,
      'fb': 110,
      'fc': 111,
      'fo': 112,
      'gm': 113,
      'hrd': 114,
      'hsk': 115,
      'ism_group': 116,
      'kit': 117,
      'mkt': 118,
      'oa': 108,
      'pr': 106,
      'pur': 119,
      'res': 120,
      'sal': 121,
      'sec': 122,
      'hc': 107,
      'hod': 123,
      'sox': 105
    };

    // Add hardcoded mappings to the map
    Object.entries(hardcodedMappings).forEach(([checkboxId, systemId]) => {
      nameToIdMap.set(checkboxId, systemId);
    });

    return nameToIdMap;
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
   * @returns {Promise<string>} The hydrated HTML content
   */
  async hydrateTemplate(data, userData) {
    let template = await this.readTemplate();
    
    // Get user permissions
    const permissions = this.getUserPermissions(data, userData.department, userData.position);
    const systemNameToIdMap = this.createSystemNameToIdMap(data);

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
   * @returns {Promise<string>} Path to the generated file
   */
  async generateForm(data, userData, outputDir = './generated-forms') {
    try {
      // Create output directory if it doesn't exist
      await fs.mkdir(outputDir, { recursive: true });

      // Generate filename based on user name and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedName = (userData.name || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `solicitud_${sanitizedName}_${timestamp}.html`;
      const filePath = path.join(outputDir, filename);

      // Hydrate the template
      const hydratedContent = await this.hydrateTemplate(data, userData);

      // Write the file
      await fs.writeFile(filePath, hydratedContent, 'utf8');

      console.log(`Form generated successfully: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error generating form:', error);
      throw new Error(`Failed to generate form: ${error.message}`);
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
                                ${forms.map(form => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${form.name}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${form.department}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${form.position}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(form.generatedAt).toLocaleString('es-CR')}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <a href="${form.filename}" target="_blank" class="text-blue-600 hover:text-blue-900">Ver Formulario</a>
                                        </td>
                                    </tr>
                                `).join('')}
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
}

module.exports = TemplateService;