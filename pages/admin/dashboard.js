document.addEventListener('DOMContentLoaded', () => {
    const teacherForm = document.getElementById('teacher-form');
    const teachersTable = document.getElementById('teachers-table');
    const votesTable = document.getElementById('votes-table');
    const teacherMessage = document.getElementById('teacher-message');
    const voteMessage = document.getElementById('vote-message');
    const notification = document.getElementById('notification');

    if (!teacherForm || !teachersTable || !votesTable || !teacherMessage || !voteMessage || !notification) {
        console.error('Client - Required elements for dashboard page not found');
        return;
    }

    const token = document.cookie.split('; ').find(row => row.startsWith('adminToken='))?.split('=')[1];
    if (!token || token !== 'admin-token') {
        console.log('Client - No valid admin token found, redirecting to login');
        window.location.href = '/pages/admin/login.html';
        return;
    }

    function showNotification(messageText, isError = false) {
        notification.textContent = messageText;
        notification.style.display = 'block';
        notification.style.backgroundColor = isError ? '#FF0000' : '#00B7D1';
        setTimeout(() => notification.style.display = 'none', 3000);
    }

    const headerContent = document.querySelector('.header-content');
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'admin-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.addEventListener('click', () => {
        document.cookie = 'adminToken=; Max-Age=0; Path=/';
        window.location.href = '/';
    });
    headerContent.appendChild(logoutBtn);

    async function loadTeachers() {
        try {
            const response = await fetch('/api/teachers', { credentials: 'include' });
            const data = await response.json();
            if (response.ok) {
                const teachers = data.teachers;
                teachersTable.innerHTML = `
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${teachers.map(teacher => `
                                <tr>
                                    <td>${teacher.id}</td>
                                    <td>${teacher.name}</td>
                                    <td>${teacher.description}</td>
                                    <td>
                                        <button class="edit-btn" onclick="toggleEditForm('${teacher.id}')">Edit</button>
                                        <button class="delete-btn" onclick="deleteTeacher('${teacher.id}')">Delete</button>
                                    </td>
                                </tr>
                                <tr id="edit-row-${teacher.id}" class="edit-row" style="display: none;">
                                    <td colspan="4">
                                        <form class="edit-teacher-form" data-teacher-id="${teacher.id}">
                                            <div class="form-group">
                                                <label>ID:</label>
                                                <input type="text" name="id" value="${teacher.id}" readonly>
                                            </div>
                                            <div class="form-group">
                                                <label>Name:</label>
                                                <input type="text" name="name" value="${teacher.name}" required>
                                            </div>
                                            <div class="form-group">
                                                <label>Bio:</label>
                                                <textarea name="bio" rows="3" required>${teacher.bio}</textarea>
                                            </div>
                                            <div class="form-group">
                                                <label>Description:</label>
                                                <input type="text" name="description" value="${teacher.description}" required>
                                            </div>
                                            <div class="form-group">
                                                <label>Classes (comma-separated):</label>
                                                <input type="text" name="classes" value="${teacher.classes.join(', ')}" required>
                                            </div>
                                            <div class="form-group">
                                                <label>Tags (comma-separated):</label>
                                                <input type="text" name="tags" value="${teacher.tags.join(', ')}" required>
                                            </div>
                                            <div class="form-group">
                                                <label>Room Number:</label>
                                                <input type="text" name="room_number" value="${teacher.room_number}" required>
                                            </div>
                                            <div class="schedule-inputs">
                                                ${teacher.schedule.map((block, i) => `
                                                    <div class="schedule-block">
                                                        <h5>Block ${i + 1}</h5>
                                                        <input type="text" name="schedule[${i}][subject]" value="${block.subject || ''}" placeholder="Subject">
                                                        <input type="text" name="schedule[${i}][grade]" value="${block.grade || ''}" placeholder="Grade">
                                                    </div>
                                                `).join('') || `
                                                    <div class="schedule-block">
                                                        <h5>Block 1</h5>
                                                        <input type="text" name="schedule[0][subject]" placeholder="Subject">
                                                        <input type="text" name="schedule[0][grade]" placeholder="Grade">
                                                    </div>
                                                    <div class="schedule-block">
                                                        <h5>Block 2</h5>
                                                        <input type="text" name="schedule[1][subject]" placeholder="Subject">
                                                        <input type="text" name="schedule[1][grade]" placeholder="Grade">
                                                    </div>
                                                    <div class="schedule-block">
                                                        <h5>Block 3</h5>
                                                        <input type="text" name="schedule[2][subject]" placeholder="Subject">
                                                        <input type="text" name="schedule[2][grade]" placeholder="Grade">
                                                    </div>
                                                    <div class="schedule-block">
                                                        <h5>Block 4</h5>
                                                        <input type="text" name="schedule[3][subject]" placeholder="Subject">
                                                        <input type="text" name="schedule[3][grade]" placeholder="Grade">
                                                    </div>
                                                `}
                                            </div>
                                            <button type="submit" class="submit-btn">Save Changes</button>
                                            <button type="button" class="cancel-btn" onclick="toggleEditForm('${teacher.id}')">Cancel</button>
                                        </form>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`;
                teacherMessage.textContent = `Loaded ${teachers.length} teachers.`;
                teacherMessage.className = 'info-message';

                // Attach event listeners to edit forms
                document.querySelectorAll('.edit-teacher-form').forEach(form => {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const teacherId = form.dataset.teacherId;
                        await updateTeacher(teacherId, form);
                    });
                });
            } else {
                throw new Error(data.error || 'Failed to load teachers');
            }
        } catch (error) {
            console.error('Client - Error loading teachers:', error.message);
            teacherMessage.textContent = 'Error loading teachers.';
            teacherMessage.className = 'error-message';
            showNotification('Error loading teachers.', true);
        }
    }

    async function loadVotes() {
        try {
            const response = await fetch('/api/admin/votes', { credentials: 'include' });
            const data = await response.json();
            if (response.ok) {
                const votes = data;
                votesTable.innerHTML = `
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Teacher ID</th>
                                <th>Rating</th>
                                <th>Comment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${votes.map(vote => `
                                <tr>
                                    <td>${vote.teacher_id}</td>
                                    <td>${vote.rating}</td>
                                    <td>${vote.comment || 'N/A'}</td>
                                    <td>
                                        <button class="update-btn" onclick="updateVote('${vote.teacher_id}')">Update</button>
                                        <button class="delete-btn" onclick="deleteVote('${vote.teacher_id}')">Delete</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`;
                voteMessage.textContent = `Loaded ${votes.length} votes.`;
                voteMessage.className = 'info-message';
            } else {
                throw new Error(data.error || 'Failed to load votes');
            }
        } catch (error) {
            console.error('Client - Error loading votes:', error.message);
            voteMessage.textContent = 'Error loading votes.';
            voteMessage.className = 'error-message';
            showNotification('Error loading votes.', true);
        }
    }

    teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(teacherForm);
        const schedule = [];
        for (let i = 0; i < 4; i++) {
            const subject = formData.get(`schedule[${i}][subject]`);
            const grade = formData.get(`schedule[${i}][grade]`);
            if (subject || grade) {
                schedule.push({ block: `Block ${i + 1}`, subject: subject || '', grade: grade || 'N/A' });
            }
        }
        const teacherData = {
            id: formData.get('id'),
            name: formData.get('name'),
            bio: formData.get('bio'),
            description: formData.get('description'),
            classes: formData.get('classes').split(',').map(c => c.trim()),
            tags: formData.get('tags').split(',').map(t => t.trim()),
            room_number: formData.get('room_number'),
            schedule: schedule
        };

        try {
            const response = await fetch('/api/teachers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(teacherData)
            });
            const data = await response.json();
            if (response.ok) {
                teacherMessage.textContent = 'Teacher added successfully!';
                teacherMessage.className = 'info-message';
                showNotification('Teacher added successfully!');
                loadTeachers();
                teacherForm.reset();
            } else {
                throw new Error(data.error || 'Failed to add teacher');
            }
        } catch (error) {
            console.error('Client - Error adding teacher:', error.message);
            teacherMessage.textContent = 'Error adding teacher.';
            teacherMessage.className = 'error-message';
            showNotification('Error adding teacher.', true);
        }
    });

    window.deleteTeacher = async (teacherId) => {
        if (confirm('Are you sure you want to delete this teacher and their votes?')) {
            try {
                const response = await fetch(`/api/admin/teachers/${teacherId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const data = await response.json();
                if (response.ok) {
                    teacherMessage.textContent = data.message;
                    teacherMessage.className = 'info-message';
                    showNotification(data.message);
                    loadTeachers();
                } else {
                    throw new Error(data.error || 'Failed to delete teacher');
                }
            } catch (error) {
                console.error('Client - Error deleting teacher:', error.message);
                teacherMessage.textContent = 'Error deleting teacher.';
                teacherMessage.className = 'error-message';
                showNotification('Error deleting teacher.', true);
            }
        }
    };

    window.toggleEditForm = (teacherId) => {
        const editRow = document.getElementById(`edit-row-${teacherId}`);
        if (editRow.style.display === 'none' || editRow.style.display === '') {
            editRow.style.display = 'table-row';
        } else {
            editRow.style.display = 'none';
        }
    };

    async function updateTeacher(teacherId, form) {
        const formData = new FormData(form);
        const schedule = [];
        for (let i = 0; i < 4; i++) {
            const subject = formData.get(`schedule[${i}][subject]`);
            const grade = formData.get(`schedule[${i}][grade]`);
            if (subject || grade) {
                schedule.push({ block: `Block ${i + 1}`, subject: subject || '', grade: grade || 'N/A' });
            }
        }
        const teacherData = {
            id: teacherId, // Use original ID, not editable
            name: formData.get('name'),
            bio: formData.get('bio'),
            description: formData.get('description'),
            classes: formData.get('classes').split(',').map(c => c.trim()),
            tags: formData.get('tags').split(',').map(t => t.trim()),
            room_number: formData.get('room_number'),
            schedule: schedule
        };

        try {
            const response = await fetch(`/api/admin/teachers/${teacherId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(teacherData)
            });
            const data = await response.json();
            if (response.ok) {
                teacherMessage.textContent = 'Teacher updated successfully!';
                teacherMessage.className = 'info-message';
                showNotification('Teacher updated successfully!');
                toggleEditForm(teacherId); // Hide form after save
                loadTeachers(); // Refresh table
            } else {
                throw new Error(data.error || 'Failed to update teacher');
            }
        } catch (error) {
            console.error('Client - Error updating teacher:', error.message);
            teacherMessage.textContent = 'Error updating teacher.';
            teacherMessage.className = 'error-message';
            showNotification('Error updating teacher.', true);
        }
    }

    window.updateVote = (teacherId) => {
        const newRating = prompt('Enter new rating (1-5):');
        const newComment = prompt('Enter new comment (optional):');
        if (newRating && !isNaN(newRating) && newRating >= 1 && newRating <= 5) {
            updateVoteRequest(teacherId, newRating, newComment);
        } else {
            showNotification('Invalid rating. Please enter a number between 1 and 5.', true);
        }
    };

    async function updateVoteRequest(teacherId, rating, comment) {
        try {
            const response = await fetch(`/api/admin/votes/${teacherId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ rating, comment })
            });
            const data = await response.json();
            if (response.ok) {
                voteMessage.textContent = data.message;
                voteMessage.className = 'info-message';
                showNotification(data.message);
                loadVotes();
            } else {
                throw new Error(data.error || 'Failed to update vote');
            }
        } catch (error) {
            console.error('Client - Error updating vote:', error.message);
            voteMessage.textContent = 'Error updating vote.';
            voteMessage.className = 'error-message';
            showNotification('Error updating vote.', true);
        }
    }

    window.deleteVote = async (teacherId) => {
        if (confirm('Are you sure you want to delete this vote?')) {
            try {
                const response = await fetch(`/api/admin/votes/${teacherId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const data = await response.json();
                if (response.ok) {
                    voteMessage.textContent = data.message;
                    voteMessage.className = 'info-message';
                    showNotification(data.message);
                    loadVotes();
                } else {
                    throw new Error(data.error || 'Failed to delete vote');
                }
            } catch (error) {
                console.error('Client - Error deleting vote:', error.message);
                voteMessage.textContent = 'Error deleting vote.';
                voteMessage.className = 'error-message';
                showNotification('Error deleting vote.', true);
            }
        }
    };

    loadTeachers();
    loadVotes();
});