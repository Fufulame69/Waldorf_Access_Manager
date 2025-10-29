const { getDatabase, saveDatabase } = require('./firebase-service');
const bcrypt = require('bcrypt');

let currentUser = null;

async function login(username, password) {
    const db = await getDatabase();
    if (db && db.users) {
        const user = db.users.find(u => u.username === username);
        if (user) {
            // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2x$)
            const isHashedPassword = user.password.startsWith('$2');
            
            let passwordMatch = false;
            if (isHashedPassword) {
                // Use bcrypt comparison for hashed passwords
                passwordMatch = await bcrypt.compare(password, user.password);
            } else {
                // Direct string comparison for plain text passwords
                passwordMatch = password === user.password;
            }
            
            if (passwordMatch) {
                currentUser = {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    name: user.name
                };
                return { success: true, user: currentUser };
            }
        }
    }
    return { success: false, error: 'Invalid username or password' };
}

function getCurrentUser() {
    return currentUser;
}

function logout() {
    currentUser = null;
}

async function addUser(userData) {
    const { username, password, role, name, active = true } = userData;
    const db = await getDatabase();
    if (!db.users) {
        db.users = [];
    }

    if (db.users.some(u => u.username === username)) {
        return { success: false, error: 'User already exists' };
    }

    // Generate a new ID for the user
    const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    
    // For now, store plain text passwords to match the existing data format
    // In production, you might want to hash passwords
    db.users.push({
        id: newId,
        username,
        password, // Store as plain text to match existing format
        role,
        name,
        active
    });

    return await saveDatabase(db);
}

async function updateUser(userData) {
    const { username, password, role, name, active } = userData;
    const db = await getDatabase();
    const user = db.users.find(u => u.username === username);

    if (!user) {
        return { success: false, error: 'User not found' };
    }

    if (password) {
        // For now, store plain text passwords to match the existing data format
        user.password = password;
    }
    if (role) user.role = role;
    if (name) user.name = name;
    if (active !== undefined) user.active = active;

    return await saveDatabase(db);
}

module.exports = {
    login,
    logout,
    getCurrentUser,
    addUser,
    updateUser
};
