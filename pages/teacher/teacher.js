document.addEventListener('DOMContentLoaded', () => {
    const teacherProfile = document.getElementById('teacher-profile');
    const notification = document.getElementById('notification');
    const modal = document.getElementById('modal');
    const confirmDelete = document.getElementById('confirm-delete');
    const cancelDelete = document.getElementById('cancel-delete');
    const dynamicTitle = document.getElementById('dynamic-title');
    const urlParams = new URLSearchParams(window.location.search);
    const teacherIdParam = urlParams.get('id');

    const teacherId = teacherIdParam ? teacherIdParam.trim() : null;
    if (!teacherId) {
        console.error('Client - Invalid or missing teacher ID from URL:', teacherIdParam);
        if (teacherProfile) {
            teacherProfile.innerHTML = '<p class="error-message">Invalid teacher ID. Please use a valid URL (e.g., ?id=Mr.%20O%27Brien).</p>';
        }
        return;
    }

    // Only require teacherProfile and notification
    const criticalElements = { teacherProfile, notification };
    const missingCritical = Object.entries(criticalElements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);

    if (missingCritical.length > 0) {
        console.error('Client - Missing critical DOM elements:', missingCritical.join(', '));
        if (teacherProfile) {
            teacherProfile.innerHTML = '<p class="error-message">Error: Missing critical elements on the page.</p>';
        }
        return;
    }

    // Log optional elements for debugging
    const optionalElements = { modal, confirmDelete, cancelDelete, dynamicTitle };
    const missingOptional = Object.entries(optionalElements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);
    if (missingOptional.length > 0) {
        console.warn('Client - Missing optional DOM elements (functionality may be limited):', missingOptional.join(', '));
    }

    let isAdmin = document.cookie.split('; ').find(row => row.startsWith('adminToken='))?.split('=')[1] === 'admin-token';
    let teacherRatings = [];
    let hasVoted = false;

    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
        const [name, value] = cookie.split('=');
        acc[name] = value;
        return acc;
    }, {});
    const votedTeachers = cookies['votedTeachers'] ? cookies['votedTeachers'].split(',').map(id => id.trim()) : [];
    hasVoted = votedTeachers.includes(teacherId);

    // Add logout button dynamically if admin
    const headerContent = document.querySelector('.header-content');
    if (isAdmin) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.className = 'admin-btn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.display = 'inline-block';
        logoutBtn.addEventListener('click', () => {
            document.cookie = 'adminToken=; Max-Age=0; Path=/';
            window.location.href = '/';
        });
        headerContent.appendChild(logoutBtn);
    }

    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.style.display = 'block';
        notification.style.backgroundColor = isError ? '#FF0000' : '#00B7D1';
        setTimeout(() => notification.style.display = 'none', 3000);
    }

    function showModal() {
        if (modal) modal.style.display = 'block';
        else console.warn('Client - Modal not available for delete confirmation');
    }

    function hideModal() {
        if (modal) modal.style.display = 'none';
    }

    window.handleImageError = function(imgElement, defaultAlt) {
        imgElement.onerror = null;
        imgElement.src = '/public/images/default-teacher.jpg';
        imgElement.alt = defaultAlt;
    };

    async function loadTeacherProfile() {
        try {
            const response = await fetch(`/api/teachers/${encodeURIComponent(teacherId)}`, { credentials: 'include' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const teacher = await response.json();
            teacherRatings = teacher.ratings || [];

            const escapedName = teacher.name.replace(/'/g, "\\'").replace(/"/g, '\\"');
            if (dynamicTitle) dynamicTitle.textContent = `${escapedName} - Teacher Profile`;
            else document.title = `${escapedName} - Teacher Profile`; // Fallback

            const ratingDistribution = calculateRatingDistribution(teacherRatings);
            const imageName = teacher.id.replace(/[^a-zA-Z0-9]/g, '');

            teacherProfile.innerHTML = `
                <div class="teacher-header">
                    <img src="/public/images/teacher${imageName}.jpg" alt="${escapedName} Profile" class="teacher-image" onerror="handleImageError(this, 'Default image for ${escapedName}')">
                    <h2 class="teacher-name">${escapedName}</h2>
                    <p class="teacher-room">Room: ${teacher.room_number}</p>
                </div>
                <div class="teacher-content">
                    <div class="teacher-left">
                        <p class="teacher-bio">${teacher.bio}</p>
                        <div class="schedule-section">
                            <h3 class="schedule-heading">Schedule</h3>
                            <table class="schedule-table">
                                <thead>
                                    <tr>
                                        <th>Block</th>
                                        <th>Subject</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${generateScheduleRows(teacher.schedule)}
                                </tbody>
                            </table>
                        </div>
                        <p class="teacher-classes"><strong>Classes:</strong> ${teacher.classes.join(', ')}</p>
                        <p><strong>Tags:</strong> ${teacher.tags.join(', ')}</p>
                    </div>
                    <div class="teacher-right">
                        <div class="average-rating">
                            <span>Average Rating: </span><span class="avg-rating">${teacher.avg_rating ? teacher.avg_rating.toFixed(1) : 'N/A'}</span>
                            <span class="vote-count">(${teacher.rating_count || 0} votes)</span>
                        </div>
                        <div class="ratings-chart">
                            <h3 class="rating-heading">Rating Distribution</h3>
                            ${generateRatingsChart(ratingDistribution)}
                        </div>
                        ${!hasVoted ? `
                        <div class="rating-section">
                            <h3 class="rating-heading">Rate This Teacher</h3>
                            <div class="rating-form" id="rating-form">
                                <div class="star-rating" id="star-rating"></div>
                                <textarea id="rating-comment" placeholder="Add a comment (optional)"></textarea>
                                <button class="submit-btn" id="submit-rating">Submit Rating</button>
                            </div>
                        </div>
                        ` : `
                        <div class="rating-section">
                            <h3 class="rating-heading">Rate This Teacher</h3>
                            <p class="info-message">You have already voted for this teacher.</p>
                        </div>
                        `}
                        <div class="reviews">
                            <h3 class="rating-heading">
                                Reviews
                                <button id="toggle-reviews" class="toggle-btn">Show All</button>
                            </h3>
                            <select id="sort-reviews" class="sort-select" style="display: none;">
                                <option value="rating-desc">Highest to Lowest</option>
                                <option value="rating-asc">Lowest to Highest</option>
                            </select>
                            <div id="reviews-list" class="reviews-list">
                                ${teacherRatings.length > 0 ? renderFirstReview(teacherRatings) : '<p>No reviews yet.</p>'}
                            </div>
                        </div>
                    </div>
                </div>
                ${isAdmin && modal && confirmDelete && cancelDelete ? '<button class="submit-btn" id="delete-teacher">Delete Teacher</button>' : ''}
            `;

            if (isAdmin && modal && confirmDelete && cancelDelete) {
                document.getElementById('delete-teacher').addEventListener('click', showModal);
            }

            renderStars();
            setupReviews(teacherRatings);

            const toggleReviewsBtn = document.getElementById('toggle-reviews');
            const reviewsList = document.getElementById('reviews-list');
            const sortReviews = document.getElementById('sort-reviews');
            if (toggleReviewsBtn && reviewsList && sortReviews) {
                toggleReviewsBtn.addEventListener('click', () => {
                    const isExpanded = reviewsList.classList.contains('expanded');
                    if (!isExpanded) {
                        reviewsList.innerHTML = renderAllReviews(teacherRatings, sortReviews.value);
                        reviewsList.classList.add('expanded');
                        toggleReviewsBtn.textContent = 'Hide';
                        sortReviews.style.display = 'block';
                    } else {
                        reviewsList.innerHTML = renderFirstReview(teacherRatings);
                        reviewsList.classList.remove('expanded');
                        toggleReviewsBtn.textContent = 'Show All';
                        sortReviews.style.display = 'none';
                    }
                });

                sortReviews.addEventListener('change', () => {
                    if (reviewsList.classList.contains('expanded')) {
                        reviewsList.innerHTML = renderAllReviews(teacherRatings, sortReviews.value);
                    }
                });
            }

            if (!hasVoted) {
                document.getElementById('submit-rating').addEventListener('click', submitRating);
            }
        } catch (error) {
            console.error('Client - Error loading teacher profile:', error.message);
            teacherProfile.innerHTML = '<p class="error-message">Error loading teacher profile. Please try again later.</p>';
        }
    }

    function calculateRatingDistribution(ratings) {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach(rating => {
            if (rating.rating >= 1 && rating.rating <= 5) {
                distribution[rating.rating]++;
            }
        });
        const total = ratings.length || 1;
        return Object.keys(distribution).map(stars => ({
            stars: parseInt(stars),
            count: distribution[stars],
            percentage: (distribution[stars] / total) * 100
        }));
    }

    function generateRatingsChart(distribution) {
        return `
            <div class="chart">
                ${distribution.map(item => `
                    <div class="chart-row">
                        <span class="chart-label">${item.stars}★</span>
                        <div class="chart-bar-container">
                            <div class="chart-bar" style="width: ${item.percentage}%;"></div>
                        </div>
                        <span class="chart-count">(${item.count})</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function generateScheduleRows(schedule) {
        const defaultBlocks = [
            { block: "Block 1", subject: "Free", grade: "N/A" },
            { block: "Block 2", subject: "Free", grade: "N/A" },
            { block: "Block 3", subject: "Free", grade: "N/A" },
            { block: "Block 4", subject: "Free", grade: "N/A" }
        ];
        const blocks = schedule && Array.isArray(schedule) ? schedule : [];
        const filledSchedule = defaultBlocks.map((defaultBlock, index) => {
            return blocks[index] || defaultBlock;
        });

        return filledSchedule.map(block => `
            <tr>
                <td>${block.block}</td>
                <td>${block.subject}</td>
                <td>${block.grade}</td>
            </tr>
        `).join('');
    }

    function renderStars() {
        const starRating = document.getElementById('star-rating');
        if (!starRating) return;

        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = '☆';
            star.addEventListener('click', () => {
                const stars = starRating.getElementsByClassName('star');
                for (let j = 0; j < stars.length; j++) {
                    stars[j].classList.toggle('selected', j < i);
                    stars[j].textContent = j < i ? '★' : '☆';
                }
                document.getElementById('submit-rating').dataset.rating = i;
            });
            starRating.appendChild(star);
        }
    }

    function renderFirstReview(ratings) {
        if (ratings.length === 0) return '<p>No reviews yet.</p>';
        const rating = ratings[0];
        const escapedComment = (rating.comment || 'No comment').replace(/'/g, "\\'").replace(/"/g, '\\"');
        return `
            <div class="review-item">
                <strong>${'★'.repeat(rating.rating) + '☆'.repeat(5 - rating.rating)}</strong>
                <span>${escapedComment}</span>
            </div>
        `;
    }

    function renderAllReviews(ratings, sortOption) {
        if (ratings.length === 0) return '<p>No reviews yet.</p>';
        let sortedRatings = [...ratings];
        if (sortOption === 'rating-desc') {
            sortedRatings.sort((a, b) => b.rating - a.rating);
        } else if (sortOption === 'rating-asc') {
            sortedRatings.sort((a, b) => a.rating - b.rating);
        }
        return sortedRatings.map(rating => {
            const escapedComment = (rating.comment || 'No comment').replace(/'/g, "\\'").replace(/"/g, '\\"');
            return `
                <div class="review-item">
                    <strong>${'★'.repeat(rating.rating) + '☆'.repeat(5 - rating.rating)}</strong>
                    <span>${escapedComment}</span>
                </div>
            `;
        }).join('');
    }

    function setupReviews(ratings) {
        const reviewsList = document.getElementById('reviews-list');
        if (reviewsList) {
            reviewsList.innerHTML = renderFirstReview(ratings);
        }
    }

    async function submitRating() {
        const rating = parseInt(document.getElementById('submit-rating').dataset.rating);
        const comment = document.getElementById('rating-comment').value.trim();
        if (!rating || rating < 1 || rating > 5) {
            showNotification('Please select a rating between 1 and 5.', true);
            return;
        }

        try {
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ teacher_id: teacherId, rating, comment })
            });
            const data = await response.json();
            if (response.ok) {
                showNotification('Rating submitted successfully!');
                hasVoted = true;
                loadTeacherProfile();
            } else {
                showNotification(data.error || 'Failed to submit rating.', true);
            }
        } catch (error) {
            console.error('Client - Error submitting rating:', error.message);
            showNotification('Error submitting rating. Please try again later.', true);
        }
    }

    if (confirmDelete) {
        confirmDelete.addEventListener('click', async () => {
            try {
                const response = await fetch(`/api/admin/teachers/${encodeURIComponent(teacherId)}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const data = await response.json();
                if (response.ok) {
                    showNotification('Teacher deleted successfully!');
                    setTimeout(() => window.location.href = '/', 2000);
                } else {
                    showNotification(data.error || 'Failed to delete teacher.', true);
                }
            } catch (error) {
                console.error('Client - Error deleting teacher:', error.message);
                showNotification('Error deleting teacher. Please try again later.', true);
            }
            hideModal();
        });
    }

    if (cancelDelete) {
        cancelDelete.addEventListener('click', hideModal);
    }

    loadTeacherProfile();
});