document.addEventListener('DOMContentLoaded', () => {
    const teacherGrid = document.getElementById('teacher-grid');
    const searchBar = document.getElementById('search-bar');
    const sortSelect = document.getElementById('sort-select');
    const cardsPerPageSelect = document.getElementById('cards-per-page');
    const pagination = document.getElementById('pagination');
    const notification = document.getElementById('notification');

    if (!teacherGrid || !searchBar || !sortSelect || !cardsPerPageSelect || !pagination || !notification) {
        console.error('Client - Required elements for home page not found');
        return;
    }

    let teachers = [];
    let currentPage = 1;
    let cardsPerPage = parseInt(cardsPerPageSelect.value) || 8;

    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.style.display = 'block';
        notification.style.backgroundColor = isError ? '#FF0000' : '#00B7D1';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    window.handleImageError = function(imgElement, defaultAlt) {
        imgElement.onerror = null;
        imgElement.src = '/public/images/default-teacher.jpg';
        imgElement.alt = defaultAlt;
    };

    async function fetchTeachers() {
        try {
            const response = await fetch(`/api/teachers?page=${currentPage}&perPage=${cardsPerPage}&sort=${sortSelect.value.split('-')[0] || 'default'}&direction=${sortSelect.value.split('-')[1] || 'asc'}&search=${encodeURIComponent(searchBar.value)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            teachers = data.teachers;
            const totalTeachers = data.total;
            renderTeachers();
            renderPagination(totalTeachers);
        } catch (error) {
            console.error('Client - Error fetching teachers:', error.message);
            showNotification('Error loading teachers. Please try again later.', true);
        }
    }

    function renderTeachers() {
        teacherGrid.innerHTML = teachers.map(teacher => {
            const imageName = teacher.id.replace(/[^a-zA-Z0-9]/g, '');
            const escapedName = teacher.name.replace(/'/g, "\\'").replace(/"/g, '\\"');
            return `
                <div class="teacher-card">
                    <a href="/pages/teacher/teacher.html?id=${encodeURIComponent(teacher.id)}" style="text-decoration: none; color: inherit;">
                        <img src="/public/images/teacher${imageName}.jpg" alt="${escapedName} Profile" onerror="handleImageError(this, 'Default image for ${escapedName}')">
                        <h3>${escapedName}</h3>
                        <p>${teacher.description}</p>
                        <div class="stars">${teacher.avg_rating ? '★'.repeat(Math.round(teacher.avg_rating)) + '☆'.repeat(5 - Math.round(teacher.avg_rating)) : 'No ratings'}</div>
                        <p>Room: ${teacher.room_number}</p>
                    </a>
                    <a href="/pages/teacher/teacher.html?id=${encodeURIComponent(teacher.id)}" class="view-profile">View Profile</a>
                </div>
            `;
        }).join('');
    }

    function renderPagination(totalTeachers) {
        const totalPages = Math.ceil(totalTeachers / cardsPerPage);
        pagination.innerHTML = '';

        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-btn';
        prevButton.textContent = 'Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchTeachers();
            }
        });
        pagination.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                currentPage = i;
                fetchTeachers();
            });
            pagination.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-btn';
        nextButton.textContent = 'Next';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchTeachers();
            }
        });
        pagination.appendChild(nextButton);
    }

    searchBar.addEventListener('input', () => {
        currentPage = 1;
        fetchTeachers();
    });

    sortSelect.addEventListener('change', () => {
        currentPage = 1;
        fetchTeachers();
    });

    cardsPerPageSelect.addEventListener('change', () => {
        cardsPerPage = parseInt(cardsPerPageSelect.value);
        currentPage = 1;
        fetchTeachers();
    });

    fetchTeachers();
});