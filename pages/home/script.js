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
            // Generate a single sentence about what the teacher teaches
            const teachingSentence = `Teaches ${teacher.classes.join(', ').toLowerCase()} classes.`;
            const card = document.createElement('div');
            card.className = 'teacher-card';
            // Show 0 stars with (0) if no votes, otherwise show stars with vote count
            const stars = teacher.avg_rating !== null && teacher.rating_count > 0 
                ? `${'★'.repeat(Math.round(teacher.avg_rating))}${'☆'.repeat(5 - Math.round(teacher.avg_rating))}`
                : '☆☆☆☆☆';
            const voteCount = teacher.rating_count || 0;
            card.innerHTML = `
                <img src="/images/teacher${teacher.id}.jpg" alt="${teacher.name}">
                <h3>${teacher.name}</h3>
                <p>${teachingSentence}</p>
                <div class="stars">${stars} (${voteCount})</div>
            `;
            // Add onerror handler for image fallback
            const img = card.querySelector('img');
            img.onerror = () => {
                console.error('LoadTeachers - Image load error for:', `/images/teacher${teacher.id}.jpg`);
                img.src = '/images/default-teacher.jpg'; // Fallback image if teacher photo fails
                img.alt = `Default image for ${teacher.name}`; // Update alt text for accessibility
            };
            card.onclick = () => window.location.href = `/teacher/teacher.html?id=${teacher.id}`;
            teacherGrid.appendChild(card);
        });
    }

    searchBar.addEventListener('input', loadTeachers);
    sortSelect.addEventListener('change', loadTeachers);
    loadTeachers();
});document.addEventListener('DOMContentLoaded', async () => {
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
                card.onclick = () => window.location.href = `/teacher/teacher.html?id=${teacher.id}`;
                const stars = teacher.avg_rating !== null && teacher.rating_count > 0 
                    ? `${'★'.repeat(Math.round(teacher.avg_rating))}${'☆'.repeat(5 - Math.round(teacher.avg_rating))}`
                    : '☆☆☆☆☆ (0)';
                card.innerHTML = `
                    <img src="/images/teacher${teacher.id}.jpg" alt="${teacher.name}" onerror="this.src='/images/default-teacher.jpg'; this.alt='Default image for ${teacher.name}';">
                    <h3>${teacher.name}</h3>
                    <p>${teacher.classes.join(', ') || 'No classes'}</p>
                    <p class="stars">${stars}</p>
                `;
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

    await loadTeachers();

    document.querySelector('.logo').addEventListener('click', () => {
        window.location.href = '/';
    });
});