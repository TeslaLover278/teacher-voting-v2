const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/home', express.static('pages/home'));
app.use('/teacher', express.static('pages/teacher'));
app.use('/admin', express.static('pages/admin'));
app.use(express.json());

// In-memory database for teachers and ratings
const teachers = [
    { 
        id: 1, 
        name: "Mrs. Emerson", 
        bio: "Mrs. Emerson is a passionate literature enthusiast with over 15 years of teaching experience. She specializes in fostering a love for reading and writing among her students, guiding them through classic and contemporary works in English 9, English 10, Creative Writing, Poetry, Drama, Literary Analysis, Literature, and Writing Workshop. Known for her engaging discussions and personalized feedback, she encourages students to explore their creativity and critical thinking, making literature come alive in her classroom. Her warm demeanor and dedication to student growth make her a beloved figure among her peers and pupils alike.", 
        summary: "Mrs. Emerson is a dedicated literature teacher who inspires students with her passion for reading, writing, and critical analysis, creating an engaging classroom environment focused on creativity and personal growth.", 
        classes: ["English 9", "English 10", "Creative Writing", "Poetry", "Drama", "Lit Analysis", "Literature", "Writing Workshop"] 
    },
    { 
        id: 2, 
        name: "Mrs. Hewitt", 
        bio: "Mrs. Hewitt is a math expert with a warm smile and a knack for making complex concepts accessible. With a decade of experience, she teaches Algebra, Geometry, Calculus, Statistics, Trigonometry, Pre-Calculus, Math Lab, and Advanced Math, using innovative methods to engage students. Her patient approach and ability to break down problems into manageable steps have earned her a reputation as an inspiring educator. Mrs. Hewitt is committed to building confidence in her students, helping them excel in mathematics and apply it to real-world scenarios with enthusiasm and clarity.", 
        summary: "Mrs. Hewitt is a skilled math educator known for her patient teaching style and innovative methods, helping students build confidence and master complex mathematical concepts.", 
        classes: ["Algebra", "Geometry", "Calculus", "Stats", "Trig", "Pre-Calc", "Math Lab", "Advanced Math"] 
    },
    { 
        id: 3, 
        name: "Mrs. Neary", 
        bio: "Mrs. Neary brings science to life with her infectious enthusiasm and hands-on approach. With 12 years of teaching experience, she covers Biology, Chemistry, Physics, Earth Science, Botany, Zoology, Astronomy, and Environmental Science, making complex scientific concepts fun and relatable. Her interactive labs and real-world applications inspire curiosity and critical thinking in her students. Known for her energetic teaching style and dedication to environmental education, Mrs. Neary fosters a deep appreciation for science, encouraging students to explore the natural world with wonder and rigor.", 
        summary: "Mrs. Neary is an energetic science teacher who uses hands-on labs and real-world applications to inspire curiosity and a deep appreciation for science among her students.", 
        classes: ["Biology", "Chemistry", "Physics", "Earth Science", "Botany", "Zoology", "Astronomy", "Environmental Science"] 
    },
    { 
        id: 4, 
        name: "Mrs. Smith", 
        bio: "Mrs. Smith is a dynamic history teacher who makes the past come alive for her students. With 18 years of experience, she teaches World History, U.S. History, Civics, Economics, Geography, Anthropology, European History, and Modern History, blending storytelling with rigorous analysis. Her passion for historical context and interactive lessons engages students, helping them understand the impact of history on today’s world. Mrs. Smith’s thoughtful approach and commitment to fostering critical historical thinking make her an inspiring educator in the classroom.", 
        summary: "Mrs. Smith is a dynamic history educator who brings the past to life through engaging storytelling and rigorous analysis, fostering critical thinking about historical impacts.", 
        classes: ["World History", "US History", "Civics", "Economics", "Geography", "Anthropology", "European History", "Modern History"] 
    },
    { 
        id: 5, 
        name: "Mr. Kalder", 
        bio: "Mr. Kalder is an artistic visionary with a deep passion for creativity, boasting 10 years of teaching experience. He instructs Drawing, Painting, Sculpture, Art History, Design, Photography, Digital Art, and Ceramics, encouraging students to explore their artistic potential through innovative projects and techniques. Known for his inspiring mentorship and hands-on approach, Mr. Kalder fosters a supportive environment where students can express themselves freely. His dedication to art education and ability to ignite creativity make him a standout figure in the art department.", 
        summary: "Mr. Kalder is a visionary art teacher who inspires creativity and artistic expression through innovative projects and a supportive classroom environment.", 
        classes: ["Drawing", "Painting", "Sculpture", "Art History", "Design", "Photography", "Digital Art", "Ceramics"] 
    },
    { 
        id: 6, 
        name: "Mr. V", 
        bio: "Mr. V, a music maestro with 14 years of teaching experience, brings harmony and passion to his classroom. He teaches Band, Choir, Music Theory, Orchestra, Jazz, Composition, Music Production, and Vocal Training, inspiring students with his expertise and love for music. Known for his dynamic performances and personalized guidance, Mr. V fosters a collaborative environment where students can develop their musical talents. His commitment to musical excellence and ability to connect with students make him a cherished educator in the music program.", 
        summary: "Mr. V is a passionate music maestro who fosters musical excellence and collaboration, inspiring students through dynamic performances and personalized guidance.", 
        classes: ["Band", "Choir", "Music Theory", "Orchestra", "Jazz", "Composition", "Music Production", "Vocal Training"] 
    },
    { 
        id: 7, 
        name: "Mr. Gabel", 
        bio: "Mr. Gabel is a PE enthusiast with 11 years of teaching experience, dedicated to promoting health and fitness among his students. He teaches Gym, Health, Sports, Yoga, Nutrition, Fitness, Team Sports, and Outdoor Education, using engaging activities to build physical skills and well-being. Known for his energetic leadership and encouragement, Mr. Gabel inspires students to lead active lifestyles and understand the importance of physical health. His positive attitude and commitment to student wellness make him a favorite among athletes and fitness enthusiasts alike.", 
        summary: "Mr. Gabel is an enthusiastic PE teacher who promotes health and fitness through engaging activities, inspiring students to lead active and healthy lifestyles.", 
        classes: ["Gym", "Health", "Sports", "Yoga", "Nutrition", "Fitness", "Team Sports", "Outdoor Education"] 
    },
    { 
        id: 8, 
        name: "Mrs. Agustin", 
        bio: "Mrs. Agustin is a tech innovator with a passion for cutting-edge technology, bringing 13 years of teaching experience to her classroom. She teaches Coding, Robotics, Web Design, AI Basics, Game Development, Cybersecurity, Data Science, and Mobile App Development, equipping students with future-ready skills. Known for her innovative projects and clear explanations, Mrs. Agustin fosters a collaborative learning environment where students can explore technology’s potential. Her enthusiasm for tech education and dedication to student success make her a leading figure in the tech curriculum.", 
        summary: "Mrs. Agustin is a tech-savvy educator who equips students with future-ready skills through innovative projects and a collaborative approach to technology education.", 
        classes: ["Coding", "Robotics", "Web Design", "AI Basics", "Game Dev", "Cybersecurity", "Data Science", "Mobile App Dev"] 
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

// Get all teachers (admin only for dashboard, but public for main app)
app.get('/api/teachers', (req, res) => {
    let teachersWithRatings = teachers.map(teacher => {
        const teacherRatings = ratings.filter(r => r.teacher_id === teacher.id);
        const avgRating = teacherRatings.length
            ? teacherRatings.reduce((sum, r) => sum + r.rating, 0) / teacherRatings.length
            : null;
        return { ...teacher, avg_rating: avgRating, rating_count: teacherRatings.length };
    });

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
            break;
    }

    const searchQuery = req.query.search || '';
    if (searchQuery) {
        teachersWithRatings = teachersWithRatings.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    console.log('Server - Fetched teachers:', teachersWithRatings.length);
    console.log('Server - Sort/Search applied:', sortBy, searchQuery);
    res.json(teachersWithRatings);
});

// Get a single teacher by ID with ratings
app.get('/api/teachers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    
    const teacherRatings = ratings.filter(r => r.teacher_id === id);
    const avgRating = teacherRatings.length
        ? teacherRatings.reduce((sum, r) => sum + r.rating, 0) / teacherRatings.length
        : null;
    console.log('Server - Fetched teacher ID:', id);
    console.log('Server - Ratings count:', teacherRatings.length);
    res.json({ ...teacher, avg_rating: avgRating, ratings: teacherRatings, rating_count: teacherRatings.length });
});

// Submit a rating
app.post('/api/ratings', (req, res) => {
    const { teacher_id, rating, review } = req.body;
    const newRating = { teacher_id: parseInt(teacher_id), rating: parseInt(rating), review };
    ratings.push(newRating);
    console.log('Server - Added rating for teacher:', teacher_id);
    console.log('Server - Ratings total:', ratings.length);
    res.json({ message: 'Rating submitted!' });
});

// Add a new teacher (admin only)
app.post('/api/teachers', authenticateAdmin, (req, res) => {
    const { name, bio, summary, classes } = req.body;
    const newTeacher = {
        id: teachers.length ? Math.max(...teachers.map(t => t.id)) + 1 : 1,
        name,
        bio,
        summary,
        classes: classes || []
    };
    teachers.push(newTeacher);
    console.log('Server - Added new teacher:', newTeacher.name);
    console.log('Server - New teacher ID:', newTeacher.id);
    res.json(newTeacher);
});

// Delete a teacher and their votes (admin only)
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});