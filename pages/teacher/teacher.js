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
            
            console.log('Client - Fetched data for teacher', teacherId);
            console.log('Client - Avg rating:', teacher.avg_rating || 'No ratings', 'Votes:', teacher.rating_count, 'Raw ratings:', teacher.ratings);

            // Use a local file path for the teacher photo based on teacher ID, with fallback
            const teacherPhotoPath = `/images/teacher${teacher.id}.jpg`;
            const img = document.getElementById('teacher-photo');
            img.src = teacherPhotoPath;
            img.onerror = () => {
                console.error('Client - Image load error for:', teacherPhotoPath);
                img.src = '/images/default-teacher.jpg'; // Fallback image if teacher photo fails
                img.alt = `Default image for ${teacher.name}`; // Update alt text for accessibility
            };

            document.getElementById('teacher-title').textContent = teacher.name; // Set name as title
            document.getElementById('teacher-room').textContent = `Room: ${teacher.room_number}`; // Show room number
            document.getElementById('teacher-bio').textContent = teacher.bio || 'No bio available.'; // Show bio
            // Only show summary if available, otherwise hide it
            const summaryElement = document.getElementById('teacher-summary');
            if (teacher.summary) {
                summaryElement.textContent = teacher.summary;
            } else {
                summaryElement.style.display = 'none';
            }

            // Show stars based on avg_rating, default to no stars if no ratings
            const stars = teacher.avg_rating !== null && teacher.rating_count > 0 
                ? `${'★'.repeat(Math.round(teacher.avg_rating))}${'☆'.repeat(5 - Math.round(teacher.avg_rating))}`
                : '☆☆☆☆☆';
            const voteCount = teacher.rating_count || 0;
            document.getElementById('avg-rating').innerHTML = stars;
            document.getElementById('vote-count').textContent = `(${voteCount})`; // Changed to (x)
            console.log('Client - Displayed rating:', stars, 'Votes:', voteCount);

            const table = document.getElementById('teacher-classes');
            table.innerHTML = ''; // Clear existing table
            
            // Create 3 rows: Blocks, Classes, Grade Levels
            const blockRow = table.insertRow();
            const classRow = table.insertRow();
            const gradeRow = table.insertRow();

            for (let i = 1; i <= 4; i++) {
                // Blocks row (Headers)
                const blockCell = blockRow.insertCell();
                blockCell.textContent = `Block ${i}`;
                blockCell.className = 'schedule-header';

                // Classes row
                const classCell = classRow.insertCell();
                classCell.textContent = teacher.classes[i - 1] || 'N/A';
                classCell.className = 'schedule-cell';

                // Grade Levels row (Infer based on class names)
                const gradeCell = gradeRow.insertCell();
                const grade = getGradeLevel(teacher.classes[i - 1] || 'N/A');
                gradeCell.textContent = grade || 'N/A';
                gradeCell.className = 'schedule-cell';
            }

            const reviewsDiv = document.getElementById('reviews');
            reviewsDiv.innerHTML = ''; // Clear existing reviews
            teacher.ratings.forEach(r => {
                const div = document.createElement('div');
                div.className = 'review-item';
                div.innerHTML = `<strong>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</strong><span>${r.comment || 'No comment provided.'}</span>`; // Show comment next to stars
                reviewsDiv.appendChild(div);
            });

            const cookieStr = getCookie('votedTeachers') || '';
            const votedArray = cookieStr ? cookieStr.split(',').map(id => parseInt(id.trim())).filter(Boolean) : [];
            const hasVoted = votedArray.includes(parseInt(teacherId)); // Check if user has voted

            const ratingForm = document.getElementById('rating-form');
            const ratingHeading = document.getElementById('rating-heading');
            const voteMessage = document.getElementById('vote-message');
            if (hasVoted) {
                ratingForm.style.display = 'none'; // Hide form if already voted
                ratingHeading.style.display = 'none';
                voteMessage.style.display = 'block'; // Show message indicating they’ve already voted
                console.log('Client - User has already voted for teacher', teacherId);
            } else {
                ratingForm.style.display = 'block';
                ratingHeading.style.display = 'block';
                voteMessage.style.display = 'none';
                console.log('Client - Form shown for new vote for teacher', teacherId);
            }

            document.querySelector('.logo').addEventListener('click', () => {
                window.location.href = '/';
            });
        } catch (error) {
            console.error('Client - Error loading teacher:', error.message);
            if (error.message.includes('HTTP error')) {
                showModal('Error loading teacher data. Please try again.');
            }
            const ratingForm = document.getElementById('rating-form');
            const ratingHeading = document.getElementById('rating-heading');
            const voteMessage = document.getElementById('vote-message');
            ratingForm.style.display = 'block';
            ratingHeading.style.display = 'block';
            voteMessage.style.display = 'none';
            const img = document.getElementById('teacher-photo');
            img.src = `/images/teacher${teacherId}.jpg`;
            img.onerror = () => {
                console.error('Client - Fallback image load error for:', teacherId);
                img.src = '/images/default-teacher.jpg';
                img.alt = `Default image for teacher ID ${teacherId}`;
            };
            document.getElementById('teacher-title').textContent = `Teacher ID ${teacherId}`;
            document.getElementById('teacher-room').textContent = 'Room: N/A'; // Default room on error
            document.getElementById('teacher-bio').textContent = 'No bio available due to error.';
            document.getElementById('teacher-summary').style.display = 'none'; // Hide summary on error
            document.getElementById('avg-rating').innerHTML = '☆☆☆☆☆';
            document.getElementById('vote-count').textContent = '(0)';
        }
    }

    // Helper function to infer grade level from class name
    function getGradeLevel(className) {
        if (!className || className === 'N/A') return null;
        const lowerCaseClass = className.toLowerCase();
        if (lowerCaseClass.includes('9')) return '9th';
        if (lowerCaseClass.includes('10')) return '10th';
        if (lowerCaseClass.includes('11')) return '11th';
        if (lowerCaseClass.includes('12')) return '12th';
        return 'All'; // Default for non-grade-specific classes (e.g., Art, PE)
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
        const stars = starRating.getElementsByClassName('star');
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

        const comment = document.getElementById('rating-comment').value.trim();
        try {
            console.log('Client - Submitting vote for teacher', teacherId, 'with comment:', comment);
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacher_id: teacherId, rating: selectedRating, comment })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            console.log('Client - Vote submitted, response:', result.message);

            const ratingForm = document.getElementById('rating-form');
            const ratingHeading = document.getElementById('rating-heading');
            const voteMessage = document.getElementById('vote-message');
            ratingForm.style.display = 'none';
            ratingHeading.style.display = 'none';
            voteMessage.style.display = 'block';
            showNotification('Your response has been recorded.');

            // Update cookie to reflect the vote
            const cookieStr = getCookie('votedTeachers') || '';
            let votedArray = cookieStr ? cookieStr.split(',').map(id => parseInt(id.trim())).filter(Boolean) : [];
            if (!votedArray.includes(parseInt(teacherId))) {
                votedArray.push(parseInt(teacherId));
                setCookie('votedTeachers', votedArray.join(','), 365);
                console.log('Client - Updated votedTeachers cookie:', votedArray);
            }

            await loadTeacher();
        } catch (error) {
            console.error('Client - Error submitting vote:', error.message, error.stack);
            if (error.message.includes('HTTP error')) {
                showModal('Error submitting your rating. Please try again.');
            }
        }
    });

    function clearVotesForTesting() {
        setCookie('votedTeachers', '', -1);
        console.log('Client - Cookies cleared for testing');
    }

    // Uncomment below in browser console for testing
    // clearVotesForTesting();

    await loadTeacher().catch(error => console.error('Client - Initial load error:', error.message, error.stack));
});

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/; SameSite=Strict`;
}
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}