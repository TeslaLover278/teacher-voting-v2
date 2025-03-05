document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teacherId = urlParams.get('id');

    async function loadTeacher() {
        try {
            const response = await fetch(`/api/teachers/${teacherId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const teacher = await response.json();
            
            console.log('LoadTeacher - Fetched data for teacher', teacherId);
            console.log('LoadTeacher - Avg rating:', teacher.avg_rating || 'No ratings');

            // Use a local file path for the teacher photo based on teacher ID
            const teacherPhotoPath = `/images/teacher${teacher.id}.jpg`;
            document.getElementById('teacher-photo').src = teacherPhotoPath;
            document.getElementById('teacher-name').textContent = teacher.name;
            document.getElementById('teacher-bio').textContent = teacher.bio;

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
            if (error.message.includes('HTTP error')) {
                alert('Error loading teacher data. Please try again.');
            } else {
                alert('An unexpected error occurred. Please try refreshing the page.');
            }
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
            console.log('Vote - Submitting for teacher', teacherId);
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacher_id: teacherId, rating: selectedRating, review })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            console.log('Vote - Submitted, response:', result.message);

            const choice = confirm("Thank you for your rating! Would you like to stay on this page to read reviews, or return to the main page?");
            if (!choice) {
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
        } catch (error) {
            console.error('Vote - Error:', error.message);
            if (error.message === 'Duplicate vote detected') {
                alert("You have already rated this teacher. Your rating remains unchanged.");
            } else if (error.message.includes('HTTP error')) {
                alert('Error submitting your rating. Please try again.');
            } else {
                alert('An unexpected error occurred while submitting your rating. Please try again.');
            }
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