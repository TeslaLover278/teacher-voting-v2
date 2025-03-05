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

    const votedTeachers = getCookie('votedTeachers').split(',').filter(Boolean);
    if (votedTeachers.includes(teacherId)) {
        document.getElementById('rating-form').style.display = 'none';
        document.getElementById('rating-heading').style.display = 'none'; // Hide "Your Rating" heading
    }

    // Home button functionality
    document.getElementById('home-button').addEventListener('click', () => {
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

    // Update cookie to allow voting on other teachers
    const votedTeachers = getCookie('votedTeachers').split(',').filter(Boolean);
    if (!votedTeachers.includes(teacherId)) {
        votedTeachers.push(teacherId);
        setCookie('votedTeachers', votedTeachers.join(','), 365);
    }

    // Hide rating form and heading after voting
    document.getElementById('rating-form').style.display = 'none';
    document.getElementById('rating-heading').style.display = 'none';
});

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