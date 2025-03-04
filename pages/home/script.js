async function loadTeachers() {
    const response = await fetch('/api/teachers');
    const teachers = await response.json();
    const grid = document.getElementById('teacher-grid');
    teachers.forEach((t, i) => {
        const card = document.createElement('div');
        card.className = 'teacher-card';
        const avgStars = t.avg_rating ? `${'★'.repeat(Math.round(t.avg_rating))}${'☆'.repeat(5 - Math.round(t.avg_rating))}` : '☆☆☆☆☆';
        card.innerHTML = `
            <img src="/images/teacher${i + 1}.jpg" alt="${t.name}">
            <h3>${t.name}</h3>
            <div class="stars ${t.avg_rating ? '' : 'grey'}">${avgStars}</div>
        `;
        card.onclick = () => window.location.href = `/teacher/teacher.html?id=${t.id}`;
        grid.appendChild(card);
    });
}

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