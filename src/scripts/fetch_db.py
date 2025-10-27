#!/usr/bin/env python3
"""
Script to fetch the current state of the Firebase database and save it to data.json
"""

import json
import os
import requests
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent.parent / "config" / ".env"
with open(env_path, 'r') as f:
    for line in f:
        if line.strip() and not line.startswith('#'):
            key, value = line.strip().split('=', 1)
            os.environ[key] = value.strip('"')

FIREBASE_URL = os.getenv("DATABASE_URL")
FIREBASE_SECRET = os.getenv("DATABASE_SECRET")

def fetch_database():
    """Fetch all data from Firebase database"""
    try:
        print(f"Attempting to connect to: {FIREBASE_URL}/.json")
        
        # First try without auth to test basic connectivity
        print("Trying without authentication first...")
        response = requests.get(f"{FIREBASE_URL}/.json")
        print(f"Response status (no auth): {response.status_code}")
        
        if not response.ok:
            print("Failed without auth, trying with database secret...")
            print(f"Using auth secret: {FIREBASE_SECRET[:10]}...")
            
            # Use the database secret for authentication as a query parameter
            response = requests.get(f"{FIREBASE_URL}/.json?auth={FIREBASE_SECRET}")
            print(f"Response status (with auth): {response.status_code}")
        
        if not response.ok:
            print(f"Error response: {response.text}")
            raise Exception(f"HTTP error! status: {response.status_code}, message: {response.text}")
        
        data = response.json()
        print("Data fetched from Firebase successfully")
        
        # Ensure all required properties exist
        if not data:
            data = {
                "metadata": {
                    "version": "1.0.0",
                    "lastModified": "2025-10-27T17:19:46.668Z",
                    "description": "Hotel Access Matrix Management Data"
                },
                "departments": [],
                "categories": [],
                "systems": [],
                "accessMatrix": {}
            }
        
        # Ensure all required properties exist even if data exists
        if not data.get("departments"):
            data["departments"] = []
        if not data.get("categories"):
            data["categories"] = []
        if not data.get("systems"):
            data["systems"] = []
        if not data.get("accessMatrix"):
            data["accessMatrix"] = {}
        if not data.get("metadata"):
            data["metadata"] = {
                "version": "1.0.0",
                "lastModified": "2025-10-27T17:19:46.668Z",
                "description": "Hotel Access Matrix Management Data"
            }
        
        return data
    
    except Exception as error:
        print(f"Error fetching data from Firebase: {error}")
        # Return default structure if Firebase fails
        return {
            "metadata": {
                "version": "1.0.0",
                "lastModified": "2025-10-27T17:19:46.668Z",
                "description": "Hotel Access Matrix Management Data"
            },
            "departments": [],
            "categories": [],
            "systems": [],
            "accessMatrix": {}
        }

def save_to_json(data, file_path):
    """Save data to JSON file"""
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Data successfully saved to {file_path}")
    except Exception as error:
        print(f"Error saving data to {file_path}: {error}")

def main():
    """Main function to fetch database and save to data.json"""
    # Determine the path to data.json (project root)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    data_file_path = project_root / "data.json"
    
    print(f"Fetching database from Firebase...")
    data = fetch_database()
    
    print(f"Saving data to {data_file_path}...")
    save_to_json(data, data_file_path)
    
    print("Done!")

if __name__ == "__main__":
    main()