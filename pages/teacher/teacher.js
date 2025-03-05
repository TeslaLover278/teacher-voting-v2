document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded - Page loaded, starting teacher profile initialization');
    const urlParams = new URLSearchParams(window.location.search);
    const teacherId = urlParams.get('id');

    // Modal and notification functions
    function showModal(message) {
        const modal = document.getElementById('modal');
        const modalMessage = document.getElementById('modal-message');
        console.log('showModal - Displaying modal:', message);
        modalMessage.textContent = message;
        modal.style.display = 'block';
    }

    function hideModal() {
        console.log('hideModal - Hiding modal');
        const modal = document.getElementById('modal');
        modal.style.display = 'none';
    }

    function showNotification(message) {
        console.log('showNotification - Displaying notification:', message);
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => {
            console.log('showNotification - Hiding notification after 5 seconds');
            notification.style.display = 'none';
        }, 5000); // Hide after 5 seconds
    }

    document.getElementById('modal-close').addEventListener('click', hideModal);

    async function loadTeacher() {
        console.log('loadTeacher - Starting to load teacher data for ID:', teacherId);
        try {
            const response = await fetch(`/api/teachers/${teacherId}`);
            console.log('loadTeacher - Fetch response status:', response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            const teacher = await response.json();
            
            console.log('loadTeacher - Fetched teacher data:', JSON.stringify(teacher, null, 2));
            console.log('loadTeacher - Bio:', teacher.bio || 'No bio');
            console.log('loadTeacher - Summary:', teacher.summary || 'No summary');
            console.log('loadTeacher - Avg rating:', teacher.avg_rating || 'No ratings', 'Votes:', teacher.rating_count);
            console.log('loadTeacher - Ratings:', teacher.ratings || 'No ratings');
            console.log('loadTeacher - Classes:', teacher.classes || 'No classes');

            // Check DOM elements exist before manipulation
            const elementsToCheck = [
                'teacher-title', 'teacher-photo', 'teacher-bio', 'teacher-summary', 
                'teacher-classes', 'reviews', 'all-reviews', 'avg-rating', 'rating-form', 'rating-heading'
            ];
            elementsToCheck.forEach(id => {
                const element = document.getElementById(id);
                console.log(`loadTeacher - Checking DOM element #${id}:`, element ? 'Found' : 'Not found');
                if (!element) {
                    console.error(`loadTeacher - Critical: Element #${id} not found in DOM`);
                    showModal(`Error: Element #${id} not found on page. Please refresh or check the HTML.`);
                }
            });

            // Use a local file path for the teacher photo based on teacher ID, with fallback
            const teacherPhotoPath = `/images/teacher${teacher.id}.jpg`;
            const img = document.getElementById('teacher-photo');
            console.log('loadTeacher - Setting teacher photo source:', teacherPhotoPath);
            img.src = teacherPhotoPath;
            img.onerror = () => {
                console.error('loadTeacher - Image load error for:', teacherPhotoPath);
                img.src = '/images/default-teacher.jpg'; // Fallback image if teacher photo fails
                img.alt = `Default image for ${teacher.name}`; // Update alt text for accessibility
            };

            document.getElementById('teacher-title').textContent = teacher.name; // Set name as title
            console.log('loadTeacher - Set teacher title:', teacher.name);
            document.getElementById('teacher-name').textContent = teacher.name; // Keep for consistency (though not used in display now)
            document.getElementById('teacher-bio').textContent = teacher.bio || 'No bio available.';
            console.log('loadTeacher - Set teacher bio:', teacher.bio || 'No bio available.');
            document.getElementById('teacher-summary').textContent = teacher.summary || 'No summary available.';
            console.log('loadTeacher - Set teacher summary:', teacher.summary || 'No summary available.');

            // Show 0 stars with (0) if no votes, otherwise show stars with vote count
            const stars = teacher.avg_rating !== null && teacher.rating_count > 0 
                ? `${'★'.repeat(Math.round(teacher.avg_rating))}${'☆'.repeat(5 - Math.round(teacher.avg_rating))}`
                : '☆☆☆☆☆';
            const voteCount = teacher.rating_count || 0;
            const avgRatingElement = document.getElementById('avg-rating');
            avgRatingElement.innerHTML = `${stars} (${voteCount})`;
            console.log('loadTeacher - Set average rating:', `${stars} (${voteCount})`);

            const table = document.getElementById('teacher-classes');
            console.log('loadTeacher - Clearing and populating teacher-classes table');
            table.innerHTML = ''; // Clear existing table
            
            // Top row: Blocks 1–4
            const topRow = table.insertRow();
            for (let i = 1; i <= 4; i++) {
                const cell = topRow.insertCell();
                cell.textContent = `Block ${i}`;
                console.log(`loadTeacher - Added Block ${i} to table header`);
            }

            // Bottom row: Teacher's schedule (classes)
            const bottomRow = table.insertRow();
            for (let i = 0; i < 4; i++) {
                const cell = bottomRow.insertCell();
                cell.textContent = teacher.classes[i] || 'N/A';
                console.log(`loadTeacher - Added class ${teacher.classes[i] || 'N/A'} to table row ${i}`);
            }

            const reviewsDiv = document.getElementById('reviews');
            console.log('loadTeacher - Clearing and populating reviews div');
            reviewsDiv.innerHTML = ''; // Clear existing reviews
            teacher.ratings.forEach(r => {
                const div = document.createElement('div');
                div.innerHTML = `<strong>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</strong><br>${r.review || 'No review'}`;
                reviewsDiv.appendChild(div);
                console.log('loadTeacher - Added review to reviews div:', `${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} - ${r.review || 'No review'}`);
            });

            // Display all reviews with ratings and comments
            const allReviewsDiv = document.getElementById('all-reviews');
            console.log('loadTeacher - Clearing and populating all-reviews div');
            allReviewsDiv.innerHTML = ''; // Clear existing all-reviews
            if (teacher.ratings && teacher.ratings.length > 0) {
                teacher.ratings.forEach(r => {
                    const reviewDiv = document.createElement('div');
                    reviewDiv.className = 'review-entry';
                    reviewDiv.innerHTML = `
                        <p><strong>Rating:</strong> ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</p>
                        <p><strong>Comment:</strong> ${r.review || 'No comment provided'}</p>
                        <hr>
                    `;
                    allReviewsDiv.appendChild(reviewDiv);
                    console.log('loadTeacher - Added review to all-reviews:', `${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} - ${r.review || 'No comment provided'}`);
                });
            } else {
                allReviewsDiv.innerHTML = '<p>No reviews yet.</p>';
                console.log('loadTeacher - No reviews available, setting default message');
            }

            const cookieStr = getCookie('votedTeachers') || '';
            console.log('loadTeacher - Cookie string for votedTeachers:', cookieStr);
            const votedArray = cookieStr ? cookieStr.split(',').map(id => id.trim()).filter(Boolean) : [];
            console.log('loadTeacher - Voted array:', votedArray);
            const hasVoted = votedArray.includes(teacherId.toString());
            console.log('loadTeacher - Has voted for teacher', teacherId, ':', hasVoted);

            const ratingForm = document.getElementById('rating-form');
            const ratingHeading = document.getElementById('rating-heading');
            console.log('loadTeacher - Rating form and heading existence:', !!ratingForm, !!ratingHeading);
            if (hasVoted) {
                ratingForm.style.display = 'block'; // Allow removing previous vote and adding new
                ratingHeading.style.display = 'block';
                console.log('Vote - Form shown for updating vote for teacher', teacherId);
            } else {
                ratingForm.style.display = 'block';
                ratingHeading.style.display = 'block';
                console.log('Vote - Form shown for new vote for teacher', teacherId);
            }

            document.querySelector('.logo').addEventListener('click', () => {
                console.log('Logo clicked - Navigating to homepage');
                window.location.href = '/';
            });
        } catch (error) {
            console.error('loadTeacher - Error:', error.message, error.stack);
            // Only show modal and set error messages for critical HTTP errors
            if (error.message.includes('HTTP error')) {
                showModal('Error loading teacher data. Please try again.');
                document.getElementById('teacher-title').textContent = `Teacher ID ${teacherId}`;
                document.getElementById('teacher-bio').textContent = 'No bio available due to error.';
                document.getElementById('teacher-summary').textContent = 'No summary available due to error.';
                document.getElementById('avg-rating').innerHTML = '☆☆☆☆☆ (0)';
                document.getElementById('all-reviews').innerHTML = '<p>No reviews available due to error.</p>';
                document.getElementById('teacher-classes').innerHTML = '<p>No classes available due to error.</p>';
            }
            const ratingForm = document.getElementById('rating-form');
            const ratingHeading = document.getElementById('rating-heading');
            console.log('loadTeacher - Ensuring rating form and heading are visible after error:', !!ratingForm, !!ratingHeading);
            ratingForm.style.display = 'block';
            ratingHeading.style.display = 'block';
            // Attempt to load photo with fallback even if fetch fails
            const img = document.getElementById('teacher-photo');
            console.log('loadTeacher - Attempting to load teacher photo for ID:', teacherId);
            img.src = `/images/teacher${teacherId}.jpg`;
            img.onerror = () => {
                console.error('loadTeacher - Fallback image load error for:', teacherId);
                img.src = '/images/default-teacher.jpg';
                img.alt = `Default image for teacher ID ${teacherId}`; // Update alt text
            };
        }
    }

    const starRating = document.getElementById('star-rating');
    console.log('Initializing star rating element:', !!starRating);
    let selectedRating = 0;
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = '☆';
        star.onclick = () => {
            console.log('Star clicked - Setting rating to:', i);
            selectedRating = i;
            updateStars();
        };
        starRating.appendChild(star);
    }
    function updateStars() {
        console.log('updateStars - Updating star display for rating:', selectedRating);
        const stars = starRating.children;
        for (let i = 0; i < 5; i++) {
            stars[i].className = 'star' + (i < selectedRating ? ' selected' : '');
            stars[i].textContent = i < selectedRating ? '★' : '☆';
        }
    }

    document.getElementById('rating-form').addEventListener('submit', async (e) => {
        console.log('rating-form - Submit event triggered for teacher', teacherId);
        e.preventDefault();
        if (!selectedRating) {
            console.log('rating-form - No rating selected, showing modal');
            showModal('Please select a rating!');
            return;
        }
        const review = document.getElementById('review').value;
        console.log('rating-form - Submitting rating:', selectedRating, 'Review:', review);

        try {
            console.log('Vote - Submitting for teacher', teacherId);
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacher_id: teacherId, rating: selectedRating, review })
            });
            console.log('Vote - Fetch response status:', response.status, response.statusText);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            console.log('Vote - Submitted, response:', result.message);

            const cookieStr = getCookie('votedTeachers') || '';
            console.log('Vote - Cookie string for votedTeachers:', cookieStr);
            const votedArray = cookieStr ? cookieStr.split(',').map(id => id.trim()).filter(Boolean) : [];
            console.log('Vote - Voted array:', votedArray);
            let hasVoted = votedArray.includes(teacherId.toString());
            console.log('Vote - Has voted for teacher', teacherId, ':', hasVoted);

            if (hasVoted) {
                // Remove the previous vote for this teacher before adding the new one
                console.log('Vote - Removing previous vote for teacher', teacherId);
                await fetch(`/api/ratings/${teacherId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });
                // Update the cookie to keep the teacher ID (since they’re still voting)
                setCookie('votedTeachers', votedArray.join(','), 365);
                console.log('Vote - Updated cookie after removing vote:', votedArray.join(','));
                showModal('Your previous vote has been removed, and your new vote has been recorded.');
            } else {
                // Add new vote
                votedArray.push(teacherId.toString());
                setCookie('votedTeachers', votedArray.join(','), 365);
                console.log('Vote - Added new vote, updated cookie:', votedArray.join(','));
                showNotification('Your response has been recorded.');
            }

            await loadTeacher();
            console.log('Vote - Reloaded teacher data after submission');
            document.getElementById('rating-form').style.display = 'none';
            document.getElementById('rating-heading').style.display = 'none';
            console.log('Vote - Hid rating form and heading');
        } catch (error) {
            console.error('Vote - Error:', error.message, error.stack);
            if (error.message.includes('HTTP error')) {
                console.log('Vote - Showing HTTP error modal');
                showModal('Error submitting your rating. Please try again.');
            }
            // Removed the "An unexpected error occurred..." modal to prevent false positives
        }
    });

    function clearVotesForTesting() {
        console.log('clearVotesForTesting - Clearing votedTeachers cookie');
        setCookie('votedTeachers', '', -1);
        console.log('Vote - Cookies cleared for testing');
    }

    // Uncomment below in browser console for testing
    // clearVotesForTesting();

    console.log('Initializing loadTeacher for teacher ID:', teacherId);
    await loadTeacher().catch(error => console.error('Initial loadTeacher - Error:', error.message, error.stack));
});

function setCookie(name, value, days) {
    console.log('setCookie - Setting cookie:', name, value, days);
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}
function getCookie(name) {
    console.log('getCookie - Retrieving cookie:', name);
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    console.log('getCookie - Cookie not found:', name);
    return '';
}