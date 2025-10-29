
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    loginBtn.addEventListener('click', async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;

        if (!username || !password) {
            errorMessage.textContent = 'Please enter both username and password.';
            return;
        }

        const result = await window.auth.login(username, password);

        if (result.success) {
            // The main process will close this window and open the main one
        } else {
            errorMessage.textContent = result.error;
        }
    });
});
