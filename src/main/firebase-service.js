// Load environment variables
const path = require('path');
const envPath = path.resolve(__dirname, '../config/.env');
console.log('Loading .env from:', envPath);
require('dotenv').config({ path: envPath });

const FIREBASE_URL = process.env.DATABASE_URL;
const FIREBASE_SECRET = process.env.DATABASE_SECRET;

/**
 * Fetch all data from Firebase database
 * @returns {Promise<Object>} The database data
 */
async function getDatabase() {
  try {
    console.log(`Attempting to connect to: ${FIREBASE_URL}/.json`);
    
    // First try without auth to test basic connectivity
    console.log("Trying without authentication first...");
    let response = await fetch(`${FIREBASE_URL}/.json`);
    console.log(`Response status (no auth): ${response.status}`);
    
    if (!response.ok) {
      console.log("Failed without auth, trying with database secret...");
      console.log(`Using auth secret: ${FIREBASE_SECRET.substring(0, 10)}...`);
      
      // Use the database secret for authentication as a query parameter
      response = await fetch(`${FIREBASE_URL}/.json?auth=${FIREBASE_SECRET}`);
      console.log(`Response status (with auth): ${response.status}`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Error response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data = await response.json();
    console.log("Data fetched from Firebase:", data);
    
    // Ensure all required properties exist
    if (!data) {
      return {
        metadata: {
          version: "1.0.0",
          lastModified: new Date().toISOString(),
          description: "Hotel Access Matrix Management Data"
        },
        departments: [],
        categories: [],
        systems: [],
        accessMatrix: {}
      };
    }
    
    // Ensure all required properties exist even if data exists
    if (!data.departments) data.departments = [];
    if (!data.categories) data.categories = [];
    if (!data.systems) data.systems = [];
    if (!data.accessMatrix) data.accessMatrix = {};
    if (!data.metadata) {
      data.metadata = {
        version: "1.0.0",
        lastModified: new Date().toISOString(),
        description: "Hotel Access Matrix Management Data"
      };
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching data from Firebase:", error);
    // Return default structure if Firebase fails
    return {
      metadata: {
        version: "1.0.0",
        lastModified: new Date().toISOString(),
        description: "Hotel Access Matrix Management Data"
      },
      departments: [],
      categories: [],
      systems: [],
      accessMatrix: {}
    };
  }
}

/**
 * Save data to Firebase database
 * @param {Object} newData - The complete data object to save
 * @returns {Promise<Object>} Result of the operation
 */
async function saveDatabase(newData) {
  try {
    // Update metadata before saving
    newData.metadata.lastModified = new Date().toISOString();
    
    console.log(`Attempting to save to: ${FIREBASE_URL}/.json`);
    
    // First try without auth to test basic connectivity
    console.log("Trying save without authentication first...");
    let response = await fetch(`${FIREBASE_URL}/.json`, {
      method: 'PUT', // 'PUT' overwrites everything at this URL
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newData), // Send the new data as a JSON string
    });
    console.log(`Save response status (no auth): ${response.status}`);
    
    if (!response.ok) {
      console.log("Failed without auth, trying with database secret...");
      console.log(`Using auth secret: ${FIREBASE_SECRET.substring(0, 10)}...`);
      
      // Use the database secret for authentication as a query parameter
      response = await fetch(`${FIREBASE_URL}/.json?auth=${FIREBASE_SECRET}`, {
        method: 'PUT', // 'PUT' overwrites everything at this URL
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData), // Send the new data as a JSON string
      });
      console.log(`Save response status (with auth): ${response.status}`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Error response: ${errorText}`);
      if (response.status === 401) {
        throw new Error("Authentication failed. Check your database secret and rules.");
      }
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Data saved to Firebase:", result);
    return { success: true, result };
  } catch (error) {
    console.error("Error saving data to Firebase:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getDatabase,
  saveDatabase
};