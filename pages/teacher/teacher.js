const urlParams = new URLSearchParams(window.location.search);
const teacherId = urlParams.get('id');

async function loadTeacher() {
    const response = await fetch(`/api/teachers/${teacherId}`);
    const teacher = await response.json();
    document.getElementById('teacher-photo').src = `/images/teacher${teacher.id}.jpg`;
    document.getElementById('teacher-name').textContent = teacher.name;
    document.getElementById('teacher-bio').textContent = teacher.bio;
    const avgStars = teacher.avg_rating ? `${'★'.repeat(Math.round(teacher.avg_rating))}${'☆'.repeat(5 - Math.round(teacher.avg_rating))}` : 'No ratings yet';
    document.getElementById('avg-rating').textContent = avgStars;

    const table = document.getElementById('teacher-classes');
    // Update to 2x4 table (8 classes max, 4 per row, 2 rows)
    for (let i = 0; i < 2; i++) {
        const row = table.insertRow();
        for (let j = 0; j < 4; j++) {
            const cell = row.insertCell();
            const classIndex = i * 4 + j;
            cell.textContent = teacher.classes[classIndex] || '';
        }
    }

    const reviewsDiv = document.getElementById('reviews');
    teacher.ratings.forEach(r => {
        const div = document.createElement('div');
        div.innerHTML = `<strong>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</strong><br>${r.review || 'No review'}`;
        reviewsDiv.appendChild(div);
    });

    const votedTeachers = getCookie('votedTeachers') || '';
    const votedArray = votedTeachers ? votedTeachers.split(',').filter(Boolean) : [];
    console.log('Debug - votedTeachers cookie:', votedTeachers);
    console.log('Debug - votedArray for teacher', teacherId, ':', votedArray, 'Includes teacherId?', votedArray.includes(teacherId.toString()));

    if (votedArray.includes(teacherId.toString())) {
        document.getElementById('rating-form').style.display = 'none';
        document.getElementById('rating-heading').style.display = 'none'; // Hide "Your Rating" heading
        console.log('Debug - Hiding form for teacher', teacherId, 'due to prior vote');
    } else {
        document.getElementById('rating-form').style.display = 'block';
        document.getElementById('rating-heading').style.display = 'block';
        console.log('Debug - Showing form for teacher', teacherId, 'as no prior vote found');
    }

    // Logo click functionality (navigates to homepage)
    document.querySelector('.logo').addEventListener('click', () => {
        window.location.href = '/';
    });
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
    const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId, rating: selectedRating, review })
    });
    const result = await response.json();

    // Use native alert instead of popup
    const choice = confirm("Thank you for your rating! Would you like to stay on this page to read reviews, or return to the main page?");
    if (!choice) {
        window.location.href = '/';
    } else {
        // Stay on page, scroll to reviews
        document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' });
    }

    // Update cookie to track only this teacher's vote, allowing voting on others by different users
    let votedTeachers = getCookie('votedTeachers') || '';
    let votedArray = votedTeachers ? votedTeachers.split(',').filter(Boolean) : [];
    console.log('Debug - Before vote, votedArray:', votedArray, 'for teacher', teacherId);
    if (!votedArray.includes(teacherId.toString())) {
        votedArray.push(teacherId.toString());
        setCookie('votedTeachers', votedArray.join(','), 365);
        console.log('Debug - Added vote for teacher', teacherId, 'New votedArray:', votedArray);
    } else {
        // Allow re-voting by notifying the user and preventing duplicate votes
        alert("You have already rated this teacher. Your rating remains unchanged.");
        return; // Exit early to prevent duplicate votes in the ratings array
    }

    // Reload teacher data to reflect the new rating
    loadTeacher();

    // Hide rating form and heading after voting
    document.getElementById('rating-form').style.display = 'none';
    document.getElementById('rating-heading').style.display = 'none';
});

// Function to clear cookies for testing (optional, comment out for production)
function clearVotesForTesting() {
    setCookie('votedTeachers', '', -1); // Expires immediately
    console.log('Votes cleared for testing');
}

// Uncomment the line below in the browser console or script to reset votes for testing
// clearVotesForTesting();

loadTeacher();

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