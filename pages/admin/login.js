document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            console.log('Client - Attempting admin login with:', { username });
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('adminToken', data.token);
                console.log('Client - Login successful, redirecting to dashboard');
                window.location.href = '/admin/dashboard.html';
            } else {
                const errorText = await response.text();
                console.error('Client - Login failed:', errorText);
                alert('Invalid credentials. Please try again.');
            }
        } catch (error) {
            console.error('Client - Login error:', error.message, error.stack);
            alert('Error logging in. Please check your connection and try again.');
        }
    });
});