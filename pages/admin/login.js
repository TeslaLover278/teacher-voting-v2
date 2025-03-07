document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const message = document.getElementById('login-message');
    const notification = document.getElementById('notification');

    if (!loginForm || !message || !notification) {
        console.error('Client - Required elements for login page not found');
        return;
    }

    function showNotification(messageText, isError = false) {
        notification.textContent = messageText;
        notification.style.display = 'block';
        notification.style.backgroundColor = isError ? '#FF0000' : '#00B7D1';
        setTimeout(() => notification.style.display = 'none', 3000);
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = loginForm.username.value;
        const password = loginForm.password.value;

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // Ensure cookies are sent/received
            });
            const data = await response.json();
            if (response.ok) {
                showNotification('Login successful!');
                window.location.href = '/pages/admin/dashboard.html';
            } else {
                message.textContent = data.error;
                message.className = 'error-message';
                showNotification(data.error, true);
            }
        } catch (error) {
            console.error('Client - Login error:', error.message);
            message.textContent = 'Error logging in. Please try again.';
            message.className = 'error-message';
            showNotification('Error logging in.', true);
        }
    });
});