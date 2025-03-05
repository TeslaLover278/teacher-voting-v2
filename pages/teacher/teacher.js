document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teacherId = urlParams.get('id');

    async function loadTeacher() {
        try {
            console.log('Debug - DOM Loaded, starting loadTeacher for teacherId:', teacherId);
            const response = await fetch(`/api/teachers/${teacherId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            const teacher = await response.json();
            
            console.log('Debug - Fetched teacher data:', teacher);

            document.getElementById('teacher-photo').src = `/images/teacher${teacher.id}.jpg`;
            document.getElementById('teacher-name').textContent = teacher.name;
            document.getElementById('teacher-bio').textContent = teacher.bio;
            const avgStars = teacher.avg_rating ? `${'★'.repeat(Math.round(teacher.avg_rating))}${'☆'.repeat(5 - Math.round(teacher.avg_rating))}` : 'No ratings yet';
            document.getElementById('avg-rating').textContent = avgStars;

            const table = document.getElementById('teacher-classes');
            table.innerHTML = ''; // Clear existing table
            for (let i = 0; i < 2; i++) {
                const row = table.insertRow();
                for (let j = 0; j < 4; j++) {
                    const cell = row.insertCell();
                    const classIndex = i * 4 + j;
                    cell.textContent = teacher.classes[classIndex] || '';
                }
            }

            const reviewsDiv = document.getElementById('reviews');
            reviewsDiv.innerHTML = ''; // Clear existing reviews
            teacher.ratings.forEach(r => {
                const div = document.createElement('div');
                div.innerHTML = `<strong>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</strong><br>${r.review || 'No review'}`;
                reviewsDiv.appendChild(div);
            });

            const cookieStr = getCookie('votedTeachers') || '';
            console.log('Debug - Raw votedTeachers cookie:', cookieStr);
            const votedArray = cookieStr ? cookieStr.split(',').map(id => id.trim()).filter(Boolean) : [];
            console.log('Debug - Parsed votedArray:', votedArray, 'for teacherId:', teacherId);

            // Only hide the form if THIS user has voted for THIS teacher
            const hasVoted = votedArray.includes(teacherId.toString());
            console.log('Debug - Has voted for teacher', teacherId, ':', hasVoted);

            const ratingForm = document.getElementById('rating-form');
            const ratingHeading = document.getElementById('rating-heading');
            if (hasVoted) {
                ratingForm.style.display = 'none';
                ratingHeading.style.display = 'none';
                console.log('Debug - Hiding form for teacher', teacherId, 'due to prior personal vote');
            } else {
                ratingForm.style.display = 'block';
                ratingHeading.style.display = 'block';
                console.log('Debug - Showing form for teacher', teacherId, 'as no prior personal vote found');
            }

            // Logo click functionality (navigates to homepage)
            document.querySelector('.logo').addEventListener('click', () => {
                window.location.href = '/';
            });
        } catch (error) {
            console.error('Debug - Error loading teacher:', error);
            // Only show alert if the error is critical (e.g., network or server error)
            if (error.message.includes('HTTP error')) {
                alert('Error loading teacher data. Please try again.');
            } else {
                // Log non-HTTP errors but don’t alert the user unless critical
                alert('An unexpected error occurred. Please try refreshing the page.');
            }
            // Ensure form is shown as a fallback if data fails to load
            const ratingForm = document.getElementById('rating-form');
            const ratingHeading = document.getElementById('rating-heading');
            ratingForm.style.display = 'block';
            ratingHeading.style.display = 'block';
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
        if (!selectedRating) return alert('Please select a rating!');
        const review = document.getElementById('review').value;

        try {
            console.log('Debug - Submitting vote for teacher', teacherId, 'with rating:', selectedRating, 'review:', review);
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacher_id: teacherId, rating: selectedRating, review })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            const result = await response.json();
            console.log('Debug - Vote submitted, response:', result);

            // Use native alert instead of popup
            const choice = confirm("Thank you for your rating! Would you like to stay on this page to read reviews, or return to the main page?");
            if (!choice) {
                window.location.href = '/';
            } else {
                // Stay on page, scroll to reviews
                document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' });
            }

            // Update cookie to track only this teacher's vote, preventing duplicate votes
            const cookieStr = getCookie('votedTeachers') || '';
            const votedArray = cookieStr ? cookieStr.split(',').map(id => id.trim()).filter(Boolean) : [];
            console.log('Debug - Before vote, cookie string:', cookieStr, 'votedArray:', votedArray, 'for teacher', teacherId);
            if (!votedArray.includes(teacherId.toString())) {
                votedArray.push(teacherId.toString());
                setCookie('votedTeachers', votedArray.join(','), 365);
                console.log('Debug - Added vote for teacher', teacherId, 'New votedArray:', votedArray, 'New cookie:', getCookie('votedTeachers'));
            } else {
                throw new Error('Duplicate vote detected for this teacher');
            }

            // Reload teacher data to reflect the new rating
            await loadTeacher();

            // Hide rating form and heading after voting
            document.getElementById('rating-form').style.display = 'none';
            document.getElementById('rating-heading').style.display = 'none';
        } catch (error) {
            console.error('Debug - Error submitting rating:', error);
            if (error.message === 'Duplicate vote detected for this teacher') {
                alert("You have already rated this teacher. Your rating remains unchanged.");
            } else if (error.message.includes('HTTP error')) {
                alert('Error submitting your rating. Please try again.');
            } else {
                alert('An unexpected error occurred while submitting your rating. Please try again.');
            }
        }
    });

    // Function to clear cookies for testing (optional, comment out for production)
    function clearVotesForTesting() {
        setCookie('votedTeachers', '', -1); // Expires immediately
        console.log('Debug - Votes cleared for testing');
    }

    // Uncomment the line below in the browser console or script to reset votes for testing
    // clearVotesForTesting();

    await loadTeacher().catch(error => console.error('Debug - Error in loadTeacher:', error));
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