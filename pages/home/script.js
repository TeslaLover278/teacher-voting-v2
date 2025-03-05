document.addEventListener('DOMContentLoaded', () => {
    const teacherGrid = document.getElementById('teacher-grid');
    const searchBar = document.getElementById('search-bar');
    const sortSelect = document.getElementById('sort-select');

    async function loadTeachers(sort = 'default', search = '') {
        try {
            const response = await fetch(`/api/teachers?sort=${sort}&search=${encodeURIComponent(search)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const teachers = await response.json();

            teacherGrid.innerHTML = '';
            teachers.forEach(teacher => {
                const card = document.createElement('div');
                card.className = 'teacher-card';
                card.innerHTML = `
                    <img src="/images/teacher${teacher.id}.jpg" alt="${teacher.name}" onerror="this.src='/images/default-teacher.jpg'; this.alt='Default image for ${teacher.name}';">
                    <h3>${teacher.name}</h3>
                    <p>${teacher.bio}</p>
                    <p class="stars">${teacher.avg_rating ? '★'.repeat(Math.round(teacher.avg_rating)) + '☆'.repeat(5 - Math.round(teacher.avg_rating)) : '☆☆☆☆☆'} (${teacher.rating_count || 0} votes)</p>
                    <a href="/teacher/teacher.html?id=${teacher.id}" class="view-profile">View Profile</a>
                `;
                card.addEventListener('click', () => window.location.href = `/teacher/teacher.html?id=${teacher.id}`);
                teacherGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading teachers:', error.message);
        }
    }

    searchBar.addEventListener('input', () => {
        loadTeachers(sortSelect.value, searchBar.value);
    });

    sortSelect.addEventListener('change', () => {
        loadTeachers(sortSelect.value, searchBar.value);
    });

    loadTeachers();
    // Version 1.15
});