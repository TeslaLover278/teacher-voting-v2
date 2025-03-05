const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/home', express.static('pages/home'));
app.use('/teacher', express.static('pages/teacher'));
app.use(express.json());

// In-memory database for teachers (easily editable)
const teachers = [
    { id: 1, name: "Mrs. Emerson", bio: "Passionate about literature.", classes: ["English 9", "English 10", "Creative Writing", "Poetry", "Drama", "Lit Analysis", "Literature", "Writing Workshop"] },
    { id: 2, name: "Mrs. Hewitt", bio: "Math expert with a smile.", classes: ["Algebra", "Geometry", "Calculus", "Stats", "Trig", "Pre-Calc", "Math Lab", "Advanced Math"] },
    { id: 3, name: "Mrs. Neary", bio: "Science made fun.", classes: ["Biology", "Chemistry", "Physics", "Earth Science", "Botany", "Zoology", "Astronomy", "Environmental Science"] },
    { id: 4, name: "Mrs. Smith", bio: "History comes alive.", classes: ["World History", "US History", "Civics", "Economics", "Geography", "Anthropology", "European History", "Modern History"] },
    { id: 5, name: "Mr. Kalder", bio: "Artistic visionary.", classes: ["Drawing", "Painting", "Sculpture", "Art History", "Design", "Photography", "Digital Art", "Ceramics"] },
    { id: 6, name: "Mr. V", bio: "Music maestro.", classes: ["Band", "Choir", "Music Theory", "Orchestra", "Jazz", "Composition", "Music Production", "Vocal Training"] },
    { id: 7, name: "Mr. Gabel", bio: "PE enthusiast.", classes: ["Gym", "Health", "Sports", "Yoga", "Nutrition", "Fitness", "Team Sports", "Outdoor Education"] },
    { id: 8, name: "Mrs. Agustin", bio: "Tech innovator.", classes: ["Coding", "Robotics", "Web Design", "AI Basics", "Game Dev", "Cybersecurity", "Data Science", "Mobile App Dev"] }
];

const ratings = []; // In-memory ratings persist during runtime for all users

// Get all teachers with average ratings and sorting options
app.get('/api/teachers', (req, res) => {
    let teachersWithRatings = teachers.map(teacher => {
        const teacherRatings = ratings.filter(r => r.teacher_id === teacher.id);
        const avgRating = teacherRatings.length
            ? teacherRatings.reduce((sum, r) => sum + r.rating, 0) / teacherRatings.length
            : null;
        return { ...teacher, avg_rating: avgRating, rating_count: teacherRatings.length };
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

    console.log('Debug - Teachers with ratings fetched:', teachersWithRatings.length, 'teachers');
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
    console.log('Debug - Teacher fetched with ID', id, ':', { ...teacher, avg_rating: avgRating, ratings: teacherRatings.length });
    res.json({ ...teacher, avg_rating: avgRating, ratings: teacherRatings });
});

// Submit a rating
app.post('/api/ratings', (req, res) => {
    const { teacher_id, rating, review } = req.body;
    const newRating = { teacher_id: parseInt(teacher_id), rating: parseInt(rating), review };
    ratings.push(newRating);
    console.log('Debug - New rating added for teacher', teacher_id, ':', newRating, 'Ratings array now:', ratings.length, 'entries');
    res.json({ message: 'Rating submitted!' });
});

// Add a new teacher (for easy addition)
app.post('/api/teachers', (req, res) => {
    const { name, bio, classes } = req.body;
    const newTeacher = {
        id: teachers.length ? Math.max(...teachers.map(t => t.id)) + 1 : 1,
        name,
        bio,
        classes: classes || []
    };
    teachers.push(newTeacher);
    console.log('Debug - New teacher added:', newTeacher);
    res.json(newTeacher);
});

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'pages/home' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});