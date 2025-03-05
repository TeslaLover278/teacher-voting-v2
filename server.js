const express = require('express');
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

// In-memory database for teachers (expanded with description field)
const teachers = [
    { 
        id: 1, 
        name: "Mrs. Emerson", 
        description: "A passionate literature lover who inspires students to explore the depths of classic and modern texts. Known for her engaging discussions.", 
        bio: "Mrs. Emerson is a passionate literature enthusiast with over 15 years of teaching experience. She specializes in fostering a love for reading and writing among her students, guiding them through classic and contemporary works in English 9, English 10, Creative Writing, Poetry, Drama, and Literary Analysis.", 
        classes: ["English 9", "English 10", "Creative Writing", "Poetry", "Drama", "Lit Analysis"] 
    },
    { 
        id: 2, 
        name: "Mrs. Hewitt", 
        description: "A math wizard with a friendly demeanor, she makes algebra and calculus approachable for all. Her classes are a hit among students.", 
        bio: "Mrs. Hewitt is a math expert with a warm smile and a knack for making complex concepts accessible. With a decade of experience, she teaches Algebra, Geometry, Calculus, Statistics, Trigonometry, and Pre-Calculus.", 
        classes: ["Algebra", "Geometry", "Calculus", "Stats", "Trig", "Pre-Calc"] 
    },
    { 
        id: 3, 
        name: "Mrs. Neary", 
        description: "A science enthusiast who brings experiments to life with her hands-on teaching style. Students enjoy her dynamic lessons.", 
        bio: "Mrs. Neary brings science to life with her infectious enthusiasm and hands-on approach. With 12 years of teaching experience, she covers Biology, Chemistry, Physics, Earth Science, Botany, and Zoology.", 
        classes: ["Biology", "Chemistry", "Physics", "Earth Science", "Botany", "Zoology"] 
    },
    { 
        id: 4, 
        name: "Mrs. Smith", 
        description: "A history buff who captivates students with stories from the past. Her classes are both educational and entertaining.", 
        bio: "Mrs. Smith is a dynamic history teacher who makes the past come alive for her students. With 18 years of experience, she teaches World History, U.S. History, Civics, Economics, Geography, and Anthropology.", 
        classes: ["World History", "US History", "Civics", "Economics", "Geography", "Anthropology"] 
    },
    { 
        id: 5, 
        name: "Mr. Kalder", 
        description: "An artistic soul who encourages creativity in every student. His art classes are a favorite for budding artists.", 
        bio: "Mr. Kalder is an artistic visionary with a deep passion for creativity, boasting 10 years of teaching experience. He instructs Drawing, Painting, Sculpture, Art History, Design, and Photography.", 
        classes: ["Drawing", "Painting", "Sculpture", "Art History", "Design", "Photography"] 
    },
    { 
        id: 6, 
        name: "Mr. V", 
        description: "A music maestro who fills the classroom with harmony and enthusiasm. His lessons inspire a love for music.", 
        bio: "Mr. V, a music maestro with 14 years of teaching experience, brings harmony and passion to his classroom. He teaches Band, Choir, Music Theory, Orchestra, Jazz, and Composition.", 
        classes: ["Band", "Choir", "Music Theory", "Orchestra", "Jazz", "Composition"] 
    },
    { 
        id: 7, 
        name: "Mr. Gabel", 
        description: "A fitness advocate who motivates students to stay active and healthy. His PE classes are energetic and fun.", 
        bio: "Mr. Gabel is a PE enthusiast with 11 years of teaching experience, dedicated to promoting health and fitness. He teaches Gym, Health, Sports, Yoga, Nutrition, and Fitness.", 
        classes: ["Gym", "Health", "Sports", "Yoga", "Nutrition", "Fitness"] 
    },
    { 
        id: 8, 
        name: "Mrs. Agustin", 
        description: "A tech-savvy educator who brings innovation to the classroom. Students love her hands-on coding projects.", 
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
    const { rating, comment } = req.body; // Changed review to comment
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

// Get all teachers with average ratings and sorting options
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

    // Apply search filter based on query parameter
    const searchQuery = req.query.search || '';
    if (searchQuery) {
        teachersWithRatings = teachersWithRatings.filter(t => 
            t.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    console.log('Server - Fetched teachers:', teachersWithRatings.length, 'Sort/Search:', { sortBy, searchQuery });
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
    const { teacher_id, rating, comment } = req.body; // Changed review to comment
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

    ratings.push({ teacher_id: teacherId, rating: parseInt(rating), comment: comment || '' }); // Store comment
    votedArray.push(teacherId);
    setCookie(res, 'votedTeachers', votedArray.join(','), 365);
    console.log('Server - Added rating for teacher:', teacherId, 'Rating:', { rating, comment });
    console.log('Server - Ratings total:', ratings.length, 'Updated ratings:', ratings);

    res.json({ message: 'Rating submitted!' });
});

// Add a new teacher (admin-only)
app.post('/api/teachers', authenticateAdmin, (req, res) => {
    const { name, bio, classes, description } = req.body; // Added description
    if (!name || !bio || !classes || !Array.isArray(classes) || !description) {
        return res.status(400).json({ error: 'Name, bio, classes (as an array), and description are required.' });
    }
    const newTeacher = {
        id: teachers.length ? Math.max(...teachers.map(t => t.id)) + 1 : 1,
        name,
        bio,
        classes,
        description
    };
    teachers.push(newTeacher);
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