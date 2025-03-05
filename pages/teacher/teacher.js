document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teacherId = urlParams.get('id');

    // Modal functions
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

    document.getElementById('modal-close').addEventListener('click', hideModal);

    async function loadTeacher() {
        try {
            const response = await fetch(`/api/teachers/${teacherId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            const teacher = await response.json();
            
            console.log('LoadTeacher - Fetched data for teacher', teacherId);
            console.log('LoadTeacher - Avg rating:', teacher.avg_rating || 'No ratings');

            // Use a local file path for the teacher photo based on teacher ID, with fallback
            const teacherPhotoPath = `/images/teacher${teacher.id}.jpg`;
            const img = document.getElementById('teacher-photo');
            img.src = teacherPhotoPath;
            img.onerror = () => {
                console.error('LoadTeacher - Image load error for:', teacherPhotoPath);
                img.src = '/images/default-teacher.jpg'; // Fallback image if teacher photo fails
                img.alt = `Default image for ${teacher.name}`; // Update alt text for accessibility
            };

            document.getElementById('teacher-name').textContent = teacher.name;
            document.getElementById('teacher-bio').textContent = teacher.bio || 'No bio available.';

            const avgStars = teacher.avg_rating ? `${'★'.repeat(Math.round(teacher.avg_rating))}${'☆'.repeat(5 - Math.round(teacher.avg_rating))}` : 'No ratings yet';
            document.getElementById('avg-rating').textContent = avgStars;

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
                ratingForm.style.display = 'none';
                ratingHeading.style.display = 'none';
                console.log('Vote - Form hidden for teacher', teacherId);
            } else {
                ratingForm.style.display = 'block';
                ratingHeading.style.display = 'block';
                console.log('Vote - Form shown for teacher', teacherId);
            }

            document.querySelector('.logo').addEventListener('click', () => {
                window.location.href = '/';
            });
        } catch (error) {
            console.error('LoadTeacher - Error:', error.message);
            // Only show modal for critical HTTP errors, not image load failures
            if (error.message.includes('HTTP error')) {
                showModal('Error loading teacher data. Please try again.');
            } else {
                // Log non-HTTP errors but don’t show modal unless critical
                showModal('An unexpected error occurred. Please try refreshing the page.');
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
            // Set default name and bio if fetch fails
            document.getElementById('teacher-name').textContent = `Teacher ID ${teacherId}`;
            document.getElementById('teacher-bio').textContent = 'No bio available due to error.';
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

            const stayOnPage = await new Promise((resolve) => {
                showModalWithChoice("Thank you for your rating! Would you like to stay on this page to read reviews, or return to the main page?", resolve);
            });
            if (!stayOnPage) {
                window.location.href = '/';
            } else {
                document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' });
            }

            const cookieStr = getCookie('votedTeachers') || '';
            const votedArray = cookieStr ? cookieStr.split(',').map(id => id.trim()).filter(Boolean) : [];
            if (!votedArray.includes(teacherId.toString())) {
                votedArray.push(teacherId.toString());
                setCookie('votedTeachers', votedArray.join(','), 365);
            } else {
                throw new Error('Duplicate vote detected');
            }

            await loadTeacher();
            document.getElementById('rating-form').style.display = 'none';
            document.getElementById('rating-heading').style.display = 'none';
            showModal('Rating submitted successfully!');
        } catch (error) {
            console.error('Vote - Error:', error.message);
            if (error.message === 'Duplicate vote detected') {
                showModal("You have already rated this teacher. Your rating remains unchanged.");
            } else if (error.message.includes('HTTP error')) {
                showModal('Error submitting your rating. Please try again.');
            } else {
                showModal('An unexpected error occurred while submitting your rating. Please try again.');
            }
        }
    });

    // Custom modal for yes/no choice (replaces confirm)
    function showModalWithChoice(message, callback) {
        const modal = document.getElementById('modal');
        const modalMessage = document.getElementById('modal-message');
        modalMessage.innerHTML = `${message}<br><button id="modal-yes" class="modal-btn">Yes</button><button id="modal-no" class="modal-btn">No</button>`;
        modal.style.display = 'block';

        document.getElementById('modal-yes').addEventListener('click', () => {
            hideModal();
            callback(true);
        }, { once: true });

        document.getElementById('modal-no').addEventListener('click', () => {
            hideModal();
            callback(false);
        }, { once: true });
    }

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