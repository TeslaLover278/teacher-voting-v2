document.addEventListener('DOMContentLoaded', () => {
    const teacherGrid = document.getElementById('teacher-grid');
    const searchBar = document.getElementById('search-bar');
    const sortSelect = document.getElementById('sort-select');

    async function loadTeachers(sort = 'default', direction = 'asc', search = '') {
        try {
            const response = await fetch(`/api/teachers?sort=${sort}&direction=${direction}&search=${encodeURIComponent(search)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            const teachers = await response.json();

            teacherGrid.innerHTML = '';
            teachers.forEach(teacher => {
                const card = document.createElement('div');
                card.className = 'teacher-card';
                card.innerHTML = `
                    <img src="/images/teacher${teacher.id}.jpg" alt="${teacher.name}" onerror="this.src='/images/default-teacher.jpg'; this.alt='Default image for ${teacher.name}';">
                    <h3>${teacher.name}</h3>
                    <p>${teacher.description}</p> <!-- Changed from bio to description -->
                    <p class="stars">${teacher.avg_rating ? '★'.repeat(Math.round(teacher.avg_rating)) + '☆'.repeat(5 - Math.round(teacher.avg_rating)) : '☆☆☆☆☆'} (${teacher.rating_count || 0} votes)</p>
                    <a href="/teacher/teacher.html?id=${teacher.id}" class="view-profile">View Profile</a>
                `;
                card.addEventListener('click', () => window.location.href = `/teacher/teacher.html?id=${teacher.id}`);
                teacherGrid.appendChild(card);
            });
            console.log('Client - Loaded teachers:', teachers.length, 'Sort/Search:', { sort, direction, search });
        } catch (error) {
            console.error('Client - Error loading teachers:', error.message);
            teacherGrid.innerHTML = '<p class="error-message">Error loading teachers. Please try again later.</p>';
        }
    }

    sortSelect.addEventListener('change', (e) => {
        const [sort, direction] = e.target.value.split('-');
        loadTeachers(sort, direction, searchBar.value);
    });

    searchBar.addEventListener('input', () => {
        const [sort, direction] = sortSelect.value.split('-');
        loadTeachers(sort, direction, searchBar.value);
    });

    // Initial load with default sorting (alphabetical ascending)
    loadTeachers('alphabetical', 'asc').catch(error => console.error('Client - Initial load error:', error.message));
});