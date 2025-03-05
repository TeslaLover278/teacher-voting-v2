document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        console.log('Client - No admin token found, redirecting to login');
        window.location.href = '/admin/login.html';
        return;
    }

    const teacherList = document.getElementById('teacher-list');
    const voteList = document.getElementById('vote-list');
    const addTeacherForm = document.getElementById('add-teacher-form');

    async function loadTeachers() {
        try {
            const response = await fetch('/api/teachers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const teachers = await response.json();
            teacherList.innerHTML = '';
            teachers.forEach(teacher => {
                const div = document.createElement('div');
                div.className = 'admin-item';
                div.innerHTML = `
                    <p>${teacher.name} - ${teacher.bio}</p>
                    <div class="admin-actions">
                        <button onclick="deleteTeacher(${teacher.id})">Delete</button>
                    </div>
                `;
                teacherList.appendChild(div);
            });
            console.log('Client - Loaded teachers:', teachers.length);
        } catch (error) {
            console.error('Client - Error loading teachers:', error.message);
            teacherList.innerHTML = '<p class="error-message">Error loading teachers. Please try again later.</p>';
        }
    }

    async function loadVotes() {
        try {
            const response = await fetch('/api/admin/votes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const votes = await response.json();
            voteList.innerHTML = '';
            votes.forEach(vote => {
                const teacher = teachers.find(t => t.id === vote.teacher_id);
                const div = document.createElement('div');
                div.className = 'admin-item';
                div.innerHTML = `
                    <p>${teacher ? teacher.name : 'Unknown Teacher'} - ${'★'.repeat(vote.rating)}${'☆'.repeat(5 - vote.rating)} - ${vote.review || 'No review'}</p>
                    <div class="admin-actions">
                        <button onclick="modifyVote(${vote.teacher_id})">Modify</button>
                        <button onclick="deleteVote(${vote.teacher_id})">Delete</button>
                    </div>
                `;
                voteList.appendChild(div);
            });
            console.log('Client - Loaded votes:', votes.length);
        } catch (error) {
            console.error('Client - Error loading votes:', error.message);
            voteList.innerHTML = '<p class="error-message">Error loading votes. Please try again later.</p>';
        }
    }

    addTeacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('teacher-name').value;
        const bio = document.getElementById('teacher-bio').value;
        const classes = document.getElementById('teacher-classes').value.split(',').map(c => c.trim());

        try {
            console.log('Client - Adding new teacher:', { name, bio, classes });
            const response = await fetch('/api/teachers', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, bio, classes })
            });
            if (response.ok) {
                const data = await response.json();
                alert('Teacher added successfully!');
                console.log('Client - Teacher added:', data);
                loadTeachers();
                addTeacherForm.reset();
            } else {
                const errorText = await response.text();
                throw new Error(errorText);
            }
        } catch (error) {
            console.error('Client - Error adding teacher:', error.message);
            alert('Error adding teacher. Please check your input and try again.');
        }
    });

    window.deleteTeacher = async (id) => {
        if (confirm('Are you sure you want to delete this teacher and all their votes?')) {
            try {
                console.log('Client - Deleting teacher ID:', id);
                const response = await fetch(`/api/admin/teachers/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    alert('Teacher deleted successfully!');
                    console.log('Client - Teacher deleted:', id);
                    loadTeachers();
                    loadVotes();
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText);
                }
            } catch (error) {
                console.error('Client - Error deleting teacher:', error.message);
                alert('Error deleting teacher. Please try again.');
            }
        }
    };

    window.modifyVote = (teacherId) => {
        const rating = prompt('Enter new rating (1-5):');
        const review = prompt('Enter new review (optional):');
        if (rating && !isNaN(rating) && rating >= 1 && rating <= 5) {
            fetch(`/api/admin/votes/${teacherId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating: parseInt(rating), review })
            }).then(response => {
                if (response.ok) {
                    alert('Vote modified successfully!');
                    console.log('Client - Vote modified for teacher:', teacherId);
                    loadVotes();
                } else {
                    response.text().then(errorText => {
                        console.error('Client - Error modifying vote:', errorText);
                        alert('Error modifying vote. Please try again.');
                    });
                }
            }).catch(error => {
                console.error('Client - Error modifying vote:', error.message, error.stack);
                alert('Error modifying vote. Please try again.');
            });
        } else {
            alert('Please enter a valid rating (1-5).');
        }
    };

    window.deleteVote = async (teacherId) => {
        if (confirm('Are you sure you want to delete this vote?')) {
            try {
                console.log('Client - Deleting vote for teacher:', teacherId);
                const response = await fetch(`/api/admin/votes/${teacherId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    alert('Vote deleted successfully!');
                    console.log('Client - Vote deleted for teacher:', teacherId);
                    loadVotes();
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText);
                }
            } catch (error) {
                console.error('Client - Error deleting vote:', error.message);
                alert('Error deleting vote. Please try again.');
            }
        }
    };

    window.logout = () => {
        console.log('Client - Logging out admin');
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login.html';
    };

    loadTeachers().catch(error => console.error('Client - Initial teachers load error:', error.message));
    loadVotes().catch(error => console.error('Client - Initial votes load error:', error.message));
});