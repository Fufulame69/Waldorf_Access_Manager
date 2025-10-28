const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Service for converting HTML content to PDF using Puppeteer
 */
class PDFConverterService {
  constructor() {
    this.browser = null;
  }

  /**
   * Initialize the browser instance
   */
  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    }
  }

  /**
   * Close the browser instance
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Convert HTML content to PDF
   * @param {string} htmlContent - The HTML content to convert
   * @param {string} outputPath - The path where the PDF will be saved
   * @param {Object} options - PDF generation options
   * @returns {Promise<string>} Path to the generated PDF
   */
  async convertHTMLToPDF(htmlContent, outputPath, options = {}) {
    try {
      // First try the Puppeteer approach
      try {
        return await this.convertWithPuppeteer(htmlContent, outputPath, options);
      } catch (puppeteerError) {
        console.warn('Puppeteer conversion failed, trying alternative method:', puppeteerError.message);
        
        // Fallback to a simpler approach - save HTML and try to convert with a different method
        const tempHtmlPath = outputPath.replace('.pdf', '_temp.html');
        await fs.writeFile(tempHtmlPath, htmlContent, 'utf8');
        
        // For now, let's try a more basic Puppeteer approach
        return await this.convertWithBasicPuppeteer(tempHtmlPath, outputPath, options);
      }
    } catch (error) {
      console.error('Error converting HTML to PDF:', error);
      throw new Error(`Failed to convert HTML to PDF: ${error.message}`);
    }
  }

  /**
   * Convert HTML to PDF using Puppeteer with enhanced error handling
   * @param {string} htmlContent - The HTML content to convert
   * @param {string} outputPath - The path where the PDF will be saved
   * @param {Object} options - PDF generation options
   * @returns {Promise<string>} Path to the generated PDF
   */
  async convertWithPuppeteer(htmlContent, outputPath, options = {}) {
    let browser = null;
    let page = null;
    
    try {
      // Create a fresh browser instance for this conversion
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      
      page = await browser.newPage();
      
      // Set content with minimal wait time
      await page.setContent(htmlContent, {
        waitUntil: 'load',
        timeout: 15000
      });

      // Default PDF options
      const pdfOptions = {
        path: outputPath,
        format: 'Letter',
        printBackground: true,
        margin: {
          top: '0.3cm',
          right: '0.3cm',
          bottom: '0.3cm',
          left: '0.3cm'
        },
        ...options
      };

      // Generate the PDF immediately
      await page.pdf(pdfOptions);
      
      console.log(`PDF generated successfully: ${outputPath}`);
      return outputPath;
    } finally {
      // Clean up resources
      if (page) {
        try {
          await page.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Convert HTML file to PDF using a basic Puppeteer approach
   * @param {string} htmlFilePath - Path to the HTML file
   * @param {string} outputPath - The path where the PDF will be saved
   * @param {Object} options - PDF generation options
   * @returns {Promise<string>} Path to the generated PDF
   */
  async convertWithBasicPuppeteer(htmlFilePath, outputPath, options = {}) {
    let browser = null;
    let page = null;
    
    try {
      // Create a fresh browser instance
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      page = await browser.newPage();
      
      // Go to the HTML file
      await page.goto(`file://${htmlFilePath}`, {
        waitUntil: 'load',
        timeout: 15000
      });

      // Default PDF options
      const pdfOptions = {
        path: outputPath,
        format: 'Letter',
        printBackground: true,
        margin: {
          top: '0.3cm',
          right: '0.3cm',
          bottom: '0.3cm',
          left: '0.3cm'
        },
        ...options
      };

      // Generate the PDF
      await page.pdf(pdfOptions);
      
      // Clean up the temporary HTML file
      try {
        await fs.unlink(htmlFilePath);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      console.log(`PDF generated successfully: ${outputPath}`);
      return outputPath;
    } finally {
      // Clean up resources
      if (page) {
        try {
          await page.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Convert an HTML file to PDF
   * @param {string} htmlFilePath - Path to the HTML file
   * @param {string} outputDir - Directory where the PDF will be saved
   * @param {Object} options - PDF generation options
   * @returns {Promise<string>} Path to the generated PDF
   */
  async convertHTMLFileToPDF(htmlFilePath, outputDir, options = {}) {
    try {
      // Read the HTML file
      const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
      
      // Generate output PDF filename
      const htmlFileName = path.basename(htmlFilePath, '.html');
      const pdfFileName = `${htmlFileName}.pdf`;
      const pdfPath = path.join(outputDir, pdfFileName);
      
      // Convert to PDF
      return await this.convertHTMLToPDF(htmlContent, pdfPath, options);
    } catch (error) {
      console.error('Error converting HTML file to PDF:', error);
      throw new Error(`Failed to convert HTML file to PDF: ${error.message}`);
    }
  }

  /**
   * Convert HTML content to PDF and return as buffer
   * @param {string} htmlContent - The HTML content to convert
   * @param {Object} options - PDF generation options
   * @returns {Promise<Buffer>} PDF buffer
   */
  async convertHTMLToPDFBuffer(htmlContent, options = {}) {
    let page = null;
    try {
      await this.initialize();
      
      page = await this.browser.newPage();
      
      // Set viewport to ensure proper rendering
      await page.setViewport({ width: 1200, height: 800 });
      
      // Set the content of the page with a more reliable wait strategy
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait for external resources to load (images, fonts, etc.)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Default PDF options optimized for the form
      const pdfOptions = {
        format: 'Letter',
        printBackground: true,
        margin: {
          top: '0.3cm',
          right: '0.3cm',
          bottom: '0.3cm',
          left: '0.3cm'
        },
        preferCSSPageSize: false,
        ...options
      };

      // Generate the PDF as buffer
      const pdfBuffer = await page.pdf(pdfOptions);
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error converting HTML to PDF buffer:', error);
      throw new Error(`Failed to convert HTML to PDF buffer: ${error.message}`);
    } finally {
      // Ensure the page is always closed
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          console.warn('Error closing page:', closeError);
        }
      }
    }
  }
}

module.exports = PDFConverterService;