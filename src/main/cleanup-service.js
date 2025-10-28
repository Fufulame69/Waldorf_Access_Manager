const fs = require('fs').promises;
const path = require('path');

/**
 * Service for cleaning up leftover files after PDF generation
 */
class CleanupService {
  constructor() {
    this.defaultCleanupDelay = 5000; // 5 seconds delay before cleanup
  }

  /**
   * Delete a file if it exists
   * @param {string} filePath - Path to the file to delete
   * @returns {Promise<boolean>} True if file was deleted or didn't exist, false if error occurred
   */
  async deleteFileIfExists(filePath) {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      console.log(`Deleted leftover file: ${filePath}`);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, which is fine
        return true;
      }
      console.warn(`Failed to delete file ${filePath}:`, error.message);
      return false;
    }
  }

  /**
   * Clean up HTML files related to a generated PDF
   * @param {string} pdfPath - Path to the generated PDF file
   * @param {Object} options - Cleanup options
   * @param {number} options.delay - Delay in milliseconds before cleanup (default: 5000)
   * @param {boolean} options.deleteIndex - Whether to delete index.html (default: false)
   * @returns {Promise<void>}
   */
  async cleanupAfterPDFGeneration(pdfPath, options = {}) {
    const {
      delay = this.defaultCleanupDelay,
      deleteIndex = false
    } = options;

    // Extract the base filename without extension
    const pdfDir = path.dirname(pdfPath);
    const pdfBasename = path.basename(pdfPath, '.pdf');
    
    // Define the HTML file path that corresponds to this PDF
    const htmlFilePath = path.join(pdfDir, `${pdfBasename}.html`);
    
    // Define the index.html path
    const indexPath = path.join(pdfDir, 'index.html');

    // Schedule cleanup with delay to ensure PDF generation is complete
    setTimeout(async () => {
      try {
        // Delete the corresponding HTML file
        await this.deleteFileIfExists(htmlFilePath);
        
        // Optionally delete the index.html file
        if (deleteIndex) {
          await this.deleteFileIfExists(indexPath);
        }
        
        console.log(`Cleanup completed for PDF: ${pdfPath}`);
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }, delay);
  }

  /**
   * Clean up all HTML files in a directory (except index.html by default)
   * @param {string} directory - Directory to clean up
   * @param {Object} options - Cleanup options
   * @param {boolean} options.deleteIndex - Whether to delete index.html (default: false)
   * @param {number} options.delay - Delay in milliseconds before cleanup (default: 5000)
   * @returns {Promise<void>}
   */
  async cleanupAllHTMLFiles(directory, options = {}) {
    const {
      deleteIndex = false,
      delay = this.defaultCleanupDelay
    } = options;

    setTimeout(async () => {
      try {
        const files = await fs.readdir(directory);
        let deletedCount = 0;
        
        for (const file of files) {
          if (file.endsWith('.html')) {
            // Skip index.html unless explicitly requested
            if (file === 'index.html' && !deleteIndex) {
              continue;
            }
            
            const filePath = path.join(directory, file);
            if (await this.deleteFileIfExists(filePath)) {
              deletedCount++;
            }
          }
        }
        
        console.log(`Cleaned up ${deletedCount} HTML files from ${directory}`);
      } catch (error) {
        console.error('Error during bulk cleanup:', error);
      }
    }, delay);
  }

  /**
   * Clean up old files based on age
   * @param {string} directory - Directory to clean up
   * @param {Object} options - Cleanup options
   * @param {number} options.maxAgeHours - Maximum age in hours before files are considered old (default: 24)
   * @param {boolean} options.deleteIndex - Whether to delete index.html if old (default: false)
   * @returns {Promise<void>}
   */
  async cleanupOldFiles(directory, options = {}) {
    const {
      maxAgeHours = 24,
      deleteIndex = false
    } = options;

    try {
      const files = await fs.readdir(directory);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      let deletedCount = 0;
      
      for (const file of files) {
        // Skip index.html unless explicitly requested
        if (file === 'index.html' && !deleteIndex) {
          continue;
        }
        
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          if (await this.deleteFileIfExists(filePath)) {
            deletedCount++;
          }
        }
      }
      
      console.log(`Cleaned up ${deletedCount} old files from ${directory}`);
    } catch (error) {
      console.error('Error during old files cleanup:', error);
    }
  }
}

module.exports = CleanupService;