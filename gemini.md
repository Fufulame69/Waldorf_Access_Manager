# Waldorf Access Manager

## 1. Project Overview

The Waldorf Access Manager is an Electron-based desktop application designed to manage hotel access permissions and matrices. It provides a user-friendly interface for administrators and staff to define and control access to various hotel systems based on department and position roles. The application leverages Firebase for real-time data storage and synchronization, ensuring that the access matrix is always up-to-date.

### Key Features

- **Department and Position Management:** Create, edit, and delete departments and positions within the hotel's organizational structure.
- **System Categorization:** Group systems into logical categories for easier management and access control.
- **Access Matrix:** Define which positions have access to which systems using an intuitive matrix interface.
- **Firebase Integration:** All data is stored and synchronized in real-time with a Firebase Realtime Database.
- **Form Generation:** Generate PDF forms for new user requests and access checklists based on predefined templates.
- **User Authentication:** Secure login system with different user roles (admin, editor, viewer) to control access to the application's features.
- **Modern UI:** A clean and responsive user interface built with HTML, CSS, and JavaScript, styled with the Waldorf Astoria brand.

## 2. Getting Started

### Prerequisites

- Node.js and npm installed
- A Firebase project with the Realtime Database enabled

### Installation and Configuration

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/Waldorf_Access_Manager.git
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   - Create a `.env` file in the `src/config/` directory.
   - Add your Firebase project configuration to the `.env` file:
     ```
     API_KEY="your-api-key"
     AUTH_DOMAIN="your-auth-domain"
     DATABASE_URL="your-database-url"
     PROJECT_ID="your-project-id"
     STORAGE_BUCKET="your-storage-bucket"
     MESSAGING_SENDER_ID="your-messaging-sender-id"
     APP_ID="your-app-id"
     ```

4. **Run the application:**
   ```bash
   npm start
   ```

## 3. Project Structure

The project is organized into the following directories:

- **`assets/`:** Contains static assets, such as the application logo.
- **`generated-forms/`:** The default directory where generated PDF forms are saved.
- **`node_modules/`:** Contains all the Node.js dependencies.
- **`src/`:** The main source code of the application.
  - **`config/`:** Contains the Firebase configuration file (`.env`).
  - **`main/`:** The Electron main process files.
    - `main.js`: The main entry point of the application.
    - `auth-service.js`: Handles user authentication.
    - `cleanup-service.js`: Provides services for cleaning up old files.
    - `firebase-service.js`: Manages the connection to the Firebase Realtime Database.
    - `pdf-converter-service.js`: Converts HTML templates to PDF forms.
    - `preload.js`: A script that runs before the renderer process is loaded, used to expose Node.js APIs to the renderer process in a secure way.
    - `template-service.js`: Manages the generation of forms from HTML templates.
  - **`renderer/`:** The Electron renderer process files (the user interface).
    - `css/`: Contains the stylesheets for the application.
    - `js/`: Contains the client-side JavaScript files.
    - `index.html`: The main HTML file for the application.
    - `login.html`: The HTML file for the login window.
  - **`scripts/`:** Contains helper scripts, such as `fetch_db.py` to fetch data from the database.
  - **`templates/`:** Contains the HTML templates for the forms.

## 4. Core Components

### Main Process

The main process is responsible for creating and managing the application's windows, handling system events, and communicating with the renderer process. The main entry point is `src/main/main.js`.

### Renderer Process

The renderer process is responsible for rendering the user interface. It consists of HTML, CSS, and JavaScript files located in the `src/renderer/` directory. The main UI is defined in `src/renderer/index.html` and the associated JavaScript logic is in `src/renderer/js/app.js`.

### Key Services

- **`AuthService`:** Manages user authentication, including login, logout, and user roles.
- **`FirebaseService`:** Provides a simple interface for interacting with the Firebase Realtime Database.
- **`TemplateService`:** Generates PDF forms from HTML templates. It uses `Puppeteer` to render the HTML and generate the PDF.
- **`CleanupService`:** Provides functionality to clean up old and leftover files from the `generated-forms` directory.

## 5. Data Management

The application uses a Firebase Realtime Database to store and synchronize data. The database structure is defined in the `src/data/data.json` file. The `FirebaseService` class in `src/main/firebase-service.js` handles all interactions with the database.

## 6. Form Generation

The application can generate two types of PDF forms:

- **Solicitud de Acceso:** A request form for new user access.
- **Checklist de Acceso:** A checklist of systems that a user has access to.

The forms are generated from HTML templates located in the `src/templates/` directory. The `TemplateService` populates the templates with data from the database and then uses `Puppeteer` to convert the HTML to PDF.

## 7. Security

The application implements the following security measures:

- **Context Isolation:** The renderer process runs in a separate context from the main process, which prevents it from accessing Node.js APIs directly.
- **Preload Script:** A preload script is used to expose a limited set of APIs from the main process to the renderer process in a secure way.
- **Node Integration Disabled:** Node.js integration is disabled in the renderer process to prevent malicious code from accessing the user's system.

## 8. Development

### Running in Development Mode

To run the application in development mode with the developer tools enabled, use the following command:

```bash
npm run dev
```

### Building for Distribution

To build the application for distribution, use the following command:

```bash
npm run build
```

This will create a distributable package for your operating system in the `dist/` directory.
