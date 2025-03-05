document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('search-bar');
    const sortSelect = document.getElementById('sort-select');
    const teacherGrid = document.getElementById('teacher-grid');

    async function loadTeachers() {
        const searchQuery = searchBar.value;
        const sortBy = sortSelect.value;
        const response = await fetch(`/api/teachers?search=${encodeURIComponent(searchQuery)}&sort=${sortBy}`);
        const teachers = await response.json();
        
        teacherGrid.innerHTML = '';
        teachers.forEach(teacher => {
            const card = document.createElement('div');
            card.className = 'teacher-card';
            card.innerHTML = `
                <img src="/images/teacher${teacher.id}.jpg" alt="${teacher.name}">
                <h3>${teacher.name}</h3>
                <p>${teacher.bio}</p>
                <div class="stars">${'★'.repeat(Math.round(teacher.avg_rating || 0))}${'☆'.repeat(5 - Math.round(teacher.avg_rating || 0))}</div>
            `;
            card.onclick = () => window.location.href = `/teacher/teacher.html?id=${teacher.id}`;
            teacherGrid.appendChild(card);
        });
    }

    searchBar.addEventListener('input', loadTeachers);
    sortSelect.addEventListener('change', loadTeachers);
    loadTeachers();
});