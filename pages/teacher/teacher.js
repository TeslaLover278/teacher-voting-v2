document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teacherId = urlParams.get('id');

    // Modal and notification functions
    function showModal(message) {
        const modal = document.getElementById('modal');
        const modalMessage = document.getElementById('modal-message');
        modalMessage.textContent = message;
        modal.style.display = 'block';
    }

    function hideModal() {
        const modal = document.getElementById('modal');
        modal.style.display = 'none';
    }

    function showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000); // Hide after 5 seconds
    }

    document.getElementById('modal-close').addEventListener('click', hideModal);

    async function loadTeacher() {
        try {
            const response = await fetch(`/api/teachers/${teacherId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            const teacher = await response.json();
            
            console.log('LoadTeacher - Fetched data for teacher', teacherId);
            console.log('LoadTeacher - Avg rating:', teacher.avg_rating || 'No ratings', 'Votes:', teacher.rating_count);

            // Use a local file path for the teacher photo based on teacher ID, with fallback
            const teacherPhotoPath = `/images/teacher${teacher.id}.jpg`;
            const img = document.getElementById('teacher-photo');
            img.src = teacherPhotoPath;
            img.onerror = () => {
                console.error('LoadTeacher - Image load error for:', teacherPhotoPath);
                img.src = '/images/default-teacher.jpg'; // Fallback image if teacher photo fails
                img.alt = `Default image for ${teacher.name}`; // Update alt text for accessibility
            };

            document.getElementById('teacher-title').textContent = teacher.name; // Set name as title
            document.getElementById('teacher-name').textContent = teacher.name; // Keep for consistency (though not used in display now)
            document.getElementById('teacher-bio').textContent = teacher.bio || 'No bio available.';
            document.getElementById('teacher-summary').textContent = teacher.summary || 'No summary available.';

            // Show 0 stars with (0) if no votes, otherwise show stars with vote count
            const stars = teacher.avg_rating !== null && teacher.rating_count > 0 
                ? `${'★'.repeat(Math.round(teacher.avg_rating))}${'☆'.repeat(5 - Math.round(teacher.avg_rating))}`
                : '☆☆☆☆☆';
            const voteCount = teacher.rating_count || 0;
            document.getElementById('avg-rating').innerHTML = `${stars} (${voteCount})`;

            const table = document.getElementById('teacher-classes');
            table.innerHTML = ''; // Clear existing table
            
            // Top row: Blocks 1–4
            const topRow = table.insertRow();
            for (let i = 1; i <= 4; i++) {
                const cell = topRow.insertCell();
                cell.textContent = `Block ${i}`;
            }

            // Bottom row: Teacher's schedule (classes)
            const bottomRow = table.insertRow();
            for (let i = 0; i < 4; i++) {
                const cell = bottomRow.insertCell();
                cell.textContent = teacher.classes[i] || 'N/A';
            }

            const reviewsDiv = document.getElementById('reviews');
            reviewsDiv.innerHTML = ''; // Clear existing reviews
            teacher.ratings.forEach(r => {
                const div = document.createElement('div');
                div.innerHTML = `<strong>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</strong><br>${r.review || 'No review'}`;
                reviewsDiv.appendChild(div);
            });

            const cookieStr = getCookie('votedTeachers') || '';
            const votedArray = cookieStr ? cookieStr.split(',').map(id => id.trim()).filter(Boolean) : [];
            const hasVoted = votedArray.includes(teacherId.toString());

            const ratingForm = document.getElementById('rating-form');
            const ratingHeading = document.getElementById('rating-heading');
            if (hasVoted) {
                ratingForm.style.display = 'block'; // Allow editing existing votes
                ratingHeading.style.display = 'block';
                console.log('Vote - Form shown for editing existing vote for teacher', teacherId);
            } else {
                ratingForm.style.display = 'block';
                ratingHeading.style.display = 'block';
                console.log('Vote - Form shown for new vote for teacher', teacherId);
            }

            document.querySelector('.logo').addEventListener('click', () => {
                window.location.href = '/';
            });
        } catch (error) {
            console.error('LoadTeacher - Error:', error.message);
            // Only show modal and set error messages for critical HTTP errors
            if (error.message.includes('HTTP error')) {
                showModal('Error loading teacher data. Please try again.');
            }
            const ratingForm = document.getElementById('rating-form');
            const ratingHeading = document.getElementById('rating-heading');
            ratingForm.style.display = 'block';
            ratingHeading.style.display = 'block';
            // Attempt to load photo with fallback even if fetch fails
            const img = document.getElementById('teacher-photo');
            img.src = `/images/teacher${teacherId}.jpg`;
            img.onerror = () => {
                console.error('LoadTeacher - Fallback image load error for:', teacherId);
                img.src = '/images/default-teacher.jpg';
                img.alt = `Default image for teacher ID ${teacherId}`; // Update alt text
            };
            // Set default values if fetch fails
            document.getElementById('teacher-title').textContent = `Teacher ID ${teacherId}`;
            document.getElementById('teacher-bio').textContent = 'No bio available due to error.';
            document.getElementById('teacher-summary').textContent = 'No summary available due to error.';
            document.getElementById('avg-rating').innerHTML = '☆☆☆☆☆ (0)';
        }
    }

    const starRating = document.getElementById('star-rating');
    let selectedRating = 0;
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = '☆';
        star.onclick = () => {
            selectedRating = i;
            updateStars();
        };
        starRating.appendChild(star);
    }
    function updateStars() {
        const stars = starRating.children;
        for (let i = 0; i < 5; i++) {
            stars[i].className = 'star' + (i < selectedRating ? ' selected' : '');
            stars[i].textContent = i < selectedRating ? '★' : '☆';
        }
    }

    document.getElementById('rating-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedRating) {
            showModal('Please select a rating!');
            return;
        }
        const review = document.getElementById('review').value;

        try {
            console.log('Vote - Submitting for teacher', teacherId);
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacher_id: teacherId, rating: selectedRating, review })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            console.log('Vote - Submitted, response:', result.message);

            const cookieStr = getCookie('votedTeachers') || '';
            const votedArray = cookieStr ? cookieStr.split(',').map(id => id.trim()).filter(Boolean) : [];
            let hasVoted = votedArray.includes(teacherId.toString());

            if (hasVoted) {
                // Edit existing vote
                await fetch(`/api/ratings/${teacherId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating: selectedRating, review })
                });
                showModal('Your previous vote has been updated.');
            } else {
                // Add new vote
                votedArray.push(teacherId.toString());
                setCookie('votedTeachers', votedArray.join(','), 365);
                showNotification('Your response has been recorded.');
            }

            await loadTeacher();
            document.getElementById('rating-form').style.display = 'none';
            document.getElementById('rating-heading').style.display = 'none';
        } catch (error) {
            console.error('Vote - Error:', error.message);
            if (error.message.includes('HTTP error')) {
                showModal('Error submitting your rating. Please try again.');
            }
            // Removed the "An unexpected error occurred..." modal to prevent false positives
        }
    });

    function clearVotesForTesting() {
        setCookie('votedTeachers', '', -1);
        console.log('Vote - Cookies cleared for testing');
    }

    // Uncomment below in browser console for testing
    // clearVotesForTesting();

    await loadTeacher().catch(error => console.error('LoadTeacher - Initial load error:', error.message));
});

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