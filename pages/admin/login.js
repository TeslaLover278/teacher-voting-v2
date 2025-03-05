document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('adminToken', data.token);
                window.location.href = '/admin/dashboard.html';
            } else {
                alert('Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Error logging in. Please try again.');
        }
    });
    // Version 1.15
});