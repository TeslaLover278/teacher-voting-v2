document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) window.location.href = '/admin/login.html';

    const teacherList = document.getElementById('teacher-list');
    const voteList = document.getElementById('vote-list');
    const addTeacherForm = document.getElementById('add-teacher-form');

    async function loadTeachers() {
        const response = await fetch('/api/teachers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
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
    }

    async function loadVotes() {
        const response = await fetch('/api/admin/votes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
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
    }

    addTeacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('teacher-name').value;
        const bio = document.getElementById('teacher-bio').value;
        const classes = document.getElementById('teacher-classes').value.split(',').map(c => c.trim());

        try {
            const response = await fetch('/api/teachers', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, bio, classes })
            });
            if (response.ok) {
                alert('Teacher added successfully!');
                loadTeachers();
                addTeacherForm.reset();
            }
        } catch (error) {
            console.error('Error adding teacher:', error);
            alert('Error adding teacher. Please try again.');
        }
    });

    window.deleteTeacher = async (id) => {
        if (confirm('Are you sure you want to delete this teacher and all their votes?')) {
            try {
                const response = await fetch(`/api/admin/teachers/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    alert('Teacher deleted successfully!');
                    loadTeachers();
                    loadVotes();
                }
            } catch (error) {
                console.error('Error deleting teacher:', error);
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
                    loadVotes();
                } else {
                    alert('Error modifying vote. Please try again.');
                }
            }).catch(error => {
                console.error('Error modifying vote:', error);
                alert('Error modifying vote. Please try again.');
            });
        } else {
            alert('Please enter a valid rating (1-5).');
        }
    };

    window.deleteVote = async (teacherId) => {
        if (confirm('Are you sure you want to delete this vote?')) {
            try {
                const response = await fetch(`/api/admin/votes/${teacherId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    alert('Vote deleted successfully!');
                    loadVotes();
                }
            } catch (error) {
                console.error('Error deleting vote:', error);
                alert('Error deleting vote. Please try again.');
            }
        }
    };

    window.logout = () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login.html';
    };

    loadTeachers();
    loadVotes();
    // Version 1.15
});