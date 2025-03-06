const express = require('express');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse'); // Import csv-parse
const app = express();
const port = process.env.PORT || 3000;

console.log('Server - Starting initialization...');

// Serve static files asynchronously
app.use(express.static('public', { maxAge: '1d' }), (req, res, next) => {
    console.log('Server - Serving static file for:', req.path);
    next();
});
app.use('/home', express.static('pages/home', { maxAge: '1d' }));
app.use('/teacher', express.static('pages/teacher', { maxAge: '1d' }));
app.use('/admin', express.static('pages/admin', { maxAge: '1d' }));
app.use(express.json());

console.log('Server - Middleware configured...');

// Load teachers from teachers.csv file
let teachers = [];
const teachersFilePath = path.join(__dirname, 'teachers.csv');

function loadTeachersFromFile() {
    try {
        if (fs.existsSync(teachersFilePath)) {
            const records = [];
            fs.createReadStream(teachersFilePath)
                .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
                .on('data', (row) => {
                    // Ensure all required fields exist and parse them
                    if (row.name && row.description && row.bio && row.classes && row.id) {
                        const classes = row.classes.split(',').map(c => c.trim()).filter(c => c); // Split and clean classes
                        const id = parseInt(row.id, 10); // Parse ID as integer
                        if (!isNaN(id)) {
                            records.push({ id, name: row.name, description: row.description, bio: row.bio, classes });
                        } else {
                            console.warn('Server - Invalid ID for teacher:', row.name, 'Skipping...');
                        }
                    } else {
                        console.warn('Server - Incomplete data for teacher, skipping:', row);
                    }
                })
                .on('end', () => {
                    teachers = records.sort((a, b) => a.id - b.id); // Sort by ID for consistency
                    console.log('Server - Loaded teachers from CSV:', teachers.length);
                })
                .on('error', (error) => {
                    throw new Error(`Error parsing CSV: ${error.message}`);
                });
        } else {
            console.log('Server - teachers.csv not found, starting with empty teachers array');
            teachers = [];
        }
    } catch (error) {
        console.error('Server - Error loading teachers from CSV:', error.message);
        teachers = []; // Fallback to empty array if file fails
    }
}

loadTeachersFromFile(); // Load teachers on startup

// Save teachers back to CSV file after modifications (for admin actions)
function saveTeachersToFile() {
    try {
        const headers = ['id', 'name', 'description', 'bio', 'classes'];
        const csvContent = [
            headers.join(','),
            ...teachers.map(t => `${t.id},${t.name},${t.description.replace(/,/g, ';')},${t.bio.replace(/,/g, ';')},${t.classes.join(',')}`)
        ].join('\n');
        fs.writeFileSync(teachersFilePath, csvContent, 'utf8');
        console.log('Server - Saved teachers to CSV');
    } catch (error) {
        console.error('Server - Error saving teachers to CSV:', error.message);
    }
}

const ratings = []; // In-memory ratings persist during runtime

// Admin credentials (hardcoded for simplicity; use a database in production)
const ADMIN_CREDENTIALS = { username: 'admin', password: 'password123' };

// Middleware for admin authorization
function authenticateAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || token !== 'admin-token') {
        return res.status(401).json({ error: 'Unauthorized access. Please log in as an admin.' });
    }
    next();
}

// Admin login
app.post('/api/admin/login', (req, res) => {
    console.log('Server - Admin login attempt for:', req.body.username);
    console.log('Server - Credentials match:', req.body.username === ADMIN_CREDENTIALS.username && req.body.password === ADMIN_CREDENTIALS.password);
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        res.json({ token: 'admin-token' });
    } else {
        res.status(401).json({ error: 'Invalid credentials. Please try again.' });
    }
});

// Get all votes (admin only)
app.get('/api/admin/votes', authenticateAdmin, (req, res) => {
    console.log('Server - Fetching all votes');
    console.log('Server - Total votes:', ratings.length);
    res.json(ratings);
});

// Modify a vote (admin only)
app.put('/api/admin/votes/:teacherId', authenticateAdmin, (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    const { rating, comment } = req.body;
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
    }
    const voteIndex = ratings.findIndex(r => r.teacher_id === teacherId);
    if (voteIndex === -1) return res.status(404).json({ error: 'Vote not found for this teacher.' });
    ratings[voteIndex] = { teacher_id: teacherId, rating: parseInt(rating), comment: comment || '' };
    console.log('Server - Modified vote for teacher:', teacherId, 'New rating:', rating);
    res.json({ message: 'Vote modified successfully!' });
});

// Delete a vote (admin only)
app.delete('/api/admin/votes/:teacherId', authenticateAdmin, (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    const initialLength = ratings.length;
    const newRatings = ratings.filter(r => r.teacher_id !== teacherId);
    if (newRatings.length < initialLength) {
        ratings.length = 0;
        ratings.push(...newRatings);
        console.log('Server - Deleted vote for teacher:', teacherId);
        console.log('Server - Votes remaining:', ratings.length);
        res.json({ message: 'Vote deleted successfully!' });
    } else {
        res.status(404).json({ error: 'No vote found for this teacher.' });
    }
});

// Get all teachers with average ratings and sorting options (ascending/descending)
app.get('/api/teachers', (req, res) => {
    let teachersWithRatings = teachers.map(teacher => {
        const teacherRatings = ratings.filter(r => r.teacher_id === teacher.id);
        const avgRating = teacherRatings.length
            ? teacherRatings.reduce((sum, r) => sum + r.rating, 0) / teacherRatings.length
            : null;
        return { 
            id: teacher.id, 
            name: teacher.name, 
            description: teacher.description, // Include description, exclude bio
            classes: teacher.classes, 
            avg_rating: avgRating, 
            rating_count: teacherRatings.length 
        };
    });

    // Apply sorting based on query parameter
    const sortBy = req.query.sort || 'default';
    const sortDirection = req.query.direction || 'asc'; // Default to ascending
    switch (sortBy) {
        case 'alphabetical':
            teachersWithRatings.sort((a, b) => 
                sortDirection === 'asc' 
                    ? a.name.localeCompare(b.name) 
                    : b.name.localeCompare(a.name)
            );
            break;
        case 'ratings':
            teachersWithRatings.sort((a, b) => 
                sortDirection === 'asc' 
                    ? (a.avg_rating || 0) - (b.avg_rating || 0) 
                    : (b.avg_rating || 0) - (a.avg_rating || 0)
            );
            break;
        case 'default':
        default:
            // No sorting (maintain original order)
            break;
    }

    // Apply search filter based on query parameter
    const searchQuery = req.query.search || '';
    if (searchQuery) {
        teachersWithRatings = teachersWithRatings.filter(t => 
            t.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    console.log('Server - Fetched teachers:', teachersWithRatings.length, 'Sort/Search:', { sortBy, sortDirection, searchQuery });
    res.json(teachersWithRatings);
});

// Get a single teacher by ID with ratings
app.get('/api/teachers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found.' });
    
    const teacherRatings = ratings.filter(r => r.teacher_id === id);
    const avgRating = teacherRatings.length
        ? teacherRatings.reduce((sum, r) => sum + r.rating, 0) / teacherRatings.length
        : null;
    console.log('Server - Fetched teacher ID:', id, 'Avg rating:', avgRating, 'Ratings count:', teacherRatings.length);
    res.json({ 
        id: teacher.id, 
        name: teacher.name, 
        bio: teacher.bio, // Include bio here
        classes: teacher.classes, 
        avg_rating: avgRating, 
        ratings: teacherRatings 
    });
});

// Submit a rating (with comment support)
app.post('/api/ratings', (req, res) => {
    const { teacher_id, rating, comment } = req.body;
    if (!teacher_id || isNaN(teacher_id) || !rating || isNaN(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid teacher ID or rating. Rating must be a number between 1 and 5.' });
    }

    const teacherId = parseInt(teacher_id);
    const cookieStr = req.headers.cookie?.split('votedTeachers=')[1]?.split(';')[0] || '';
    const votedArray = cookieStr ? cookieStr.split(',').map(id => parseInt(id.trim())).filter(Boolean) : [];

    if (votedArray.includes(teacherId)) {
        res.status(400).json({ error: 'You have already voted for this teacher.' });
        return;
    }

    ratings.push({ teacher_id: teacherId, rating: parseInt(rating), comment: comment || '' });
    votedArray.push(teacherId);
    setCookie(res, 'votedTeachers', votedArray.join(','), 365);
    console.log('Server - Added rating for teacher:', teacherId, 'Rating:', { rating, comment });
    console.log('Server - Ratings total:', ratings.length, 'Updated ratings:', ratings);

    res.json({ message: 'Rating submitted!' });
});

// Add a new teacher (admin-only, now via CSV)
app.post('/api/teachers', authenticateAdmin, (req, res) => {
    const { name, bio, classes, description, id } = req.body;
    if (!name || !bio || !classes || !Array.isArray(classes) || !description || isNaN(id)) {
        return res.status(400).json({ error: 'Name, bio, classes (as an array), description, and ID (number) are required.' });
    }
    const newTeacher = { id: parseInt(id), name, description, bio, classes };
    teachers.push(newTeacher);
    saveTeachersToFile(); // Save to CSV after adding
    console.log('Server - Added new teacher:', newTeacher.name, 'ID:', newTeacher.id);
    res.json(newTeacher);
});

// Delete a teacher and their votes (admin-only)
app.delete('/api/admin/teachers/:id', authenticateAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid teacher ID.' });
    const initialTeacherLength = teachers.length;
    const newTeachers = teachers.filter(t => t.id !== id);
    if (newTeachers.length < initialTeacherLength) {
        teachers.length = 0;
        teachers.push(...newTeachers);
        const newRatings = ratings.filter(r => r.teacher_id !== id); // Remove all votes for this teacher
        ratings.length = 0;
        ratings.push(...newRatings);
        saveTeachersToFile(); // Save to CSV after deletion
        console.log('Server - Deleted teacher ID:', id, 'Teachers remaining:', teachers.length);
        res.json({ message: 'Teacher and their votes deleted successfully!' });
    } else {
        res.status(404).json({ error: 'Teacher not found.' });
    }
});

app.get('/', (req, res) => {
    console.log('Server - Redirecting to home page...');
    res.sendFile('index.html', { root: 'pages/home' });
});

console.log('Server - Starting server on port', port);
app.listen(port, () => {
    console.log(`Server running on port ${port} - Version 1.15 - Started at ${new Date().toISOString()}`);
});

// Helper function to set cookies in the response
function setCookie(res, name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    res.setHeader('Set-Cookie', `${name}=${value}; Expires=${date.toUTCString()}; Path=/; SameSite=Strict`);
}