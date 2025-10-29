const { getDatabase } = require('./firebase-service');
const bcrypt = require('bcrypt');

let currentUser = null;

async function login(username, password) {
    const db = await getDatabase();
    if (db && db.users) {
        const user = db.users.find(u => u.username === username);
        if (user && await bcrypt.compare(password, user.password)) {
            currentUser = { username: user.username, role: user.role };
            return { success: true, user: currentUser };
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
    const { username, password, role } = userData;
    const db = await getDatabase();
    if (!db.users) {
        db.users = [];
    }

    if (db.users.some(u => u.username === username)) {
        return { success: false, error: 'User already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.users.push({ username, password: hashedPassword, role });

    return await saveDatabase(db);
}

async function updateUser(userData) {
    const { username, password, role } = userData;
    const db = await getDatabase();
    const user = db.users.find(u => u.username === username);

    if (!user) {
        return { success: false, error: 'User not found' };
    }

    if (password) {
        user.password = await bcrypt.hash(password, 10);
    }
    user.role = role;

    return await saveDatabase(db);
}

module.exports = {
    login,
    logout,
    getCurrentUser,
    addUser,
    updateUser
};
