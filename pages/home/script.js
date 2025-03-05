async function loadTeachers(sort = 'default', search = '') {
    const url = `/api/teachers?sort=${encodeURIComponent(sort)}&search=${encodeURIComponent(search)}`;
    const response = await fetch(url);
    const teachers = await response.json();
    const grid = document.getElementById('teacher-grid');
    grid.innerHTML = ''; // Clear existing teachers
    teachers.forEach((t, i) => {
        const card = document.createElement('div');
        card.className = 'teacher-card';
        const avgStars = t.avg_rating ? `${'★'.repeat(Math.round(t.avg_rating))}${'☆'.repeat(5 - Math.round(t.avg_rating))}` : '☆☆☆☆☆';
        card.innerHTML = `
            <img src="/images/teacher${t.id}.jpg" alt="${t.name}">
            <h3>${t.name}</h3>
            <div class="stars ${t.avg_rating ? '' : 'grey'}">${avgStars}</div>
        `;
        card.onclick = () => window.location.href = `/teacher/teacher.html?id=${t.id}`;
        grid.appendChild(card);
    });
}

document.getElementById('search-bar').addEventListener('input', (e) => {
    loadTeachers(document.getElementById('sort-select').value, e.target.value);
});

document.getElementById('sort-select').addEventListener('change', (e) => {
    loadTeachers(e.target.value, document.getElementById('search-bar').value);
});

// Load initial teachers
loadTeachers();

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}