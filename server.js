const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/home', express.static('pages/home'));
app.use('/teacher', express.static('pages/teacher'));
app.use('/admin', express.static('pages/admin'));
app.use(express.json());

// In-memory database for teachers (expanded with detailed bios and classes from Version 1.14.6)
const teachers = [
    { 
        id: 1, 
        name: "Mrs. Emerson", 
        bio: "Mrs. Emerson is a passionate literature enthusiast with over 15 years of teaching experience. She specializes in fostering a love for reading and writing among her students, guiding them through classic and contemporary works in English 9, English 10, Creative Writing, Poetry, Drama, and Literary Analysis.", 
        classes: ["English 9", "English 10", "Creative Writing", "Poetry", "Drama", "Lit Analysis"] 
    },
    { 
        id: 2, 
        name: "Mrs. Hewitt", 
        bio: "Mrs. Hewitt is a math expert with a warm smile and a knack for making complex concepts accessible. With a decade of experience, she teaches Algebra, Geometry, Calculus, Statistics, Trigonometry, and Pre-Calculus.", 
        classes: ["Algebra", "Geometry", "Calculus", "Stats", "Trig", "Pre-Calc"] 
    },
    { 
        id: 3, 
        name: "Mrs. Neary", 
        bio: "Mrs. Neary brings science to life with her infectious enthusiasm and hands-on approach. With 12 years of teaching experience, she covers Biology, Chemistry, Physics, Earth Science, Botany, and Zoology.", 
        classes: ["Biology", "Chemistry", "Physics", "Earth Science", "Botany", "Zoology"] 
    },
    { 
        id: 4, 
        name: "Mrs. Smith", 
        bio: "Mrs. Smith is a dynamic history teacher who makes the past come alive for her students. With 18 years of experience, she teaches World History, U.S. History, Civics, Economics, Geography, and Anthropology.", 
        classes: ["World History", "US History", "Civics", "Economics", "Geography", "Anthropology"] 
    },
    { 
        id: 5, 
        name: "Mr. Kalder", 
        bio: "Mr. Kalder is an artistic visionary with a deep passion for creativity, boasting 10 years of teaching experience. He instructs Drawing, Painting, Sculpture, Art History, Design, and Photography.", 
        classes: ["Drawing", "Painting", "Sculpture", "Art History", "Design", "Photography"] 
    },
    { 
        id: 6, 
        name: "Mr. V", 
        bio: "Mr. V, a music maestro with 14 years of teaching experience, brings harmony and passion to his classroom. He teaches Band, Choir, Music Theory, Orchestra, Jazz, and Composition.", 
        classes: ["Band", "Choir", "Music Theory", "Orchestra", "Jazz", "Composition"] 
    },
    { 
        id: 7, 
        name: "Mr. Gabel", 
        bio: "Mr. Gabel is a PE enthusiast with 11 years of teaching experience, dedicated to promoting health and fitness. He teaches Gym, Health, Sports, Yoga, Nutrition, and Fitness.", 
        classes: ["Gym", "Health", "Sports", "Yoga", "Nutrition", "Fitness"] 
    },
    { 
        id: 8, 
        name: "Mrs. Agustin", 
        bio: "Mrs. Agustin is a tech innovator with a passion for cutting-edge technology, bringing 13 years of teaching experience to her classroom. She teaches Coding, Robotics, Web Design, AI Basics, Game Dev, and Cybersecurity.", 
        classes: ["Coding", "Robotics", "Web Design", "AI Basics", "Game Dev", "Cybersecurity"] 
    }
];

const ratings = []; // In-memory ratings persist during runtime

// Admin credentials (hardcoded for simplicity; use a database in production)
const ADMIN_CREDENTIALS = { username: 'admin', password: 'password123' };

// Middleware for admin authorization
function authenticateAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || token !== 'admin-token') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// Admin login
app.post('/api/admin/login', (req, res) => {
    console.log('Server - Admin login attempt for:', req.body.username);
    console.log('Server - Credentials match:', req.body.username === ADMIN_CREDENTIALS.username && req.body.password === ADMIN_CREDENTIALS.password);
    const { username, password } = req.body;
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        res.json({ token: 'admin-token' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
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
    const { rating, review } = req.body;
    const voteIndex = ratings.findIndex(r => r.teacher_id === teacherId);
    if (voteIndex === -1) return res.status(404).json({ error: 'Vote not found' });
    ratings[voteIndex] = { teacher_id: teacherId, rating: parseInt(rating), review: review || '' };
    console.log('Server - Modified vote for teacher:', teacherId);
    console.log('Server - New rating:', rating);
    res.json({ message: 'Vote modified successfully!' });
});

// Delete a vote (admin only)
app.delete('/api/admin/votes/:teacherId', authenticateAdmin, (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    const initialLength = ratings.length;
    ratings = ratings.filter(r => r.teacher_id !== teacherId);
    if (ratings.length < initialLength) {
        console.log('Server - Deleted vote for teacher:', teacherId);
        console.log('Server - Votes remaining:', ratings.length);
        res.json({ message: 'Vote deleted successfully!' });
    } else {
        res.status(404).json({ error: 'Vote not found' });
    }
});

// Get all teachers with average ratings and sorting options (from working logic, expanded with ratings)
app.get('/api/teachers', (req, res) => {
    let teachersWithRatings = teachers.map(teacher => {
        const teacherRatings = ratings.filter(r => r.teacher_id === teacher.id);
        const avgRating = teacherRatings.length
            ? teacherRatings.reduce((sum, r) => sum + r.rating, 0) / teacherRatings.length
            : null;
        return { ...teacher, avg_rating: avgRating, rating_count: teacherRatings.length };
    });

    // Apply sorting based on query parameter (from working logic)
    const sortBy = req.query.sort || 'default';
    switch (sortBy) {
        case 'alphabetical':
            teachersWithRatings.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'ratings':
            teachersWithRatings.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
            break;
        case 'default':
        default:
            // No sorting (maintain original order)
            break;
    }

    // Apply search filter based on query parameter (from working logic)
    const searchQuery = req.query.search || '';
    if (searchQuery) {
        teachersWithRatings = teachersWithRatings.filter(t => 
            t.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    console.log('Server - Fetched teachers:', teachersWithRatings.length);
    console.log('Server - Sort/Search applied:', sortBy, searchQuery);
    res.json(teachersWithRatings);
});

// Get a single teacher by ID with ratings (from working logic, expanded with ratings)
app.get('/api/teachers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    
    const teacherRatings = ratings.filter(r => r.teacher_id === id);
    const avgRating = teacherRatings.length
        ? teacherRatings.reduce((sum, r) => sum + r.rating, 0) / teacherRatings.length
        : null;
    console.log('Server - Fetched teacher ID:', id);
    console.log('Server - Avg rating:', avgRating, 'Ratings count:', teacherRatings.length, 'Raw ratings:', teacherRatings);
    res.json({ ...teacher, avg_rating: avgRating, ratings: teacherRatings });
});

// Submit a rating (from working logic, with single vote enforcement from Version 1.14.6)
app.post('/api/ratings', (req, res) => {
    const { teacher_id, rating, review } = req.body;
    const teacherId = parseInt(teacher_id);

    const cookieStr = req.headers.cookie?.split('votedTeachers=')[1]?.split(';')[0] || '';
    const votedArray = cookieStr ? cookieStr.split(',').map(id => parseInt(id.trim())).filter(Boolean) : [];

    if (votedArray.includes(teacherId)) {
        res.status(400).json({ error: 'You have already voted for this teacher.' });
        return;
    }

    ratings.push({ teacher_id: teacherId, rating: parseInt(rating), review: review || '' });
    votedArray.push(teacherId);
    setCookie(res, 'votedTeachers', votedArray.join(','), 365);
    console.log('Server - Added rating for teacher:', teacher_id, 'Rating:', { teacher_id, rating, review });
    console.log('Server - Ratings total:', ratings.length, 'Updated ratings:', ratings);

    res.json({ message: 'Rating submitted!' });
});

// Add a new teacher (from working logic, with admin restriction from Version 1.14.6)
app.post('/api/teachers', authenticateAdmin, (req, res) => {
    const { name, bio, classes } = req.body;
    const newTeacher = {
        id: teachers.length ? Math.max(...teachers.map(t => t.id)) + 1 : 1,
        name,
        bio,
        classes: classes || []
    };
    teachers.push(newTeacher);
    console.log('Server - Added new teacher:', newTeacher.name);
    console.log('Server - New teacher ID:', newTeacher.id);
    res.json(newTeacher);
});

// Delete a teacher and their votes (from Version 1.14.6, admin-only)
app.delete('/api/admin/teachers/:id', authenticateAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const initialTeacherLength = teachers.length;
    teachers = teachers.filter(t => t.id !== id);
    if (teachers.length < initialTeacherLength) {
        ratings = ratings.filter(r => r.teacher_id !== id); // Remove all votes for this teacher
        console.log('Server - Deleted teacher ID:', id);
        console.log('Server - Teachers remaining:', teachers.length);
        res.json({ message: 'Teacher and their votes deleted successfully!' });
    } else {
        res.status(404).json({ error: 'Teacher not found' });
    }
});

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'pages/home' });
});

// Helper function to set cookies in the response
function setCookie(res, name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    res.setHeader('Set-Cookie', `${name}=${value}; Expires=${date.toUTCString()}; Path=/`);
}

app.listen(port, () => {
    console.log(`Server running on port ${port} - Version 1.15`);
});