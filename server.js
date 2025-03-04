const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/home', express.static('pages/home'));
app.use('/teacher', express.static('pages/teacher'));
app.use(express.json());

const teachers = [
    { id: 1, name: "Mrs. Emerson", bio: "Passionate about literature.", classes: ["English 9", "English 10", "Creative Writing", "Poetry", "Drama", "Lit Analysis"] },
    { id: 2, name: "Mrs. Hewitt", bio: "Math expert with a smile.", classes: ["Algebra", "Geometry", "Calculus", "Stats", "Trig", "Pre-Calc"] },
    { id: 3, name: "Mrs. Neary", bio: "Science made fun.", classes: ["Biology", "Chemistry", "Physics", "Earth Science", "Botany", "Zoology"] },
    { id: 4, name: "Mrs. Smith", bio: "History comes alive.", classes: ["World History", "US History", "Civics", "Economics", "Geography", "Anthropology"] },
    { id: 5, name: "Mr. Kalder", bio: "Artistic visionary.", classes: ["Drawing", "Painting", "Sculpture", "Art History", "Design", "Photography"] },
    { id: 6, name: "Mr. V", bio: "Music maestro.", classes: ["Band", "Choir", "Music Theory", "Orchestra", "Jazz", "Composition"] },
    { id: 7, name: "Mr. Gabel", bio: "PE enthusiast.", classes: ["Gym", "Health", "Sports", "Yoga", "Nutrition", "Fitness"] },
    { id: 8, name: "Mrs. Agustin", bio: "Tech innovator.", classes: ["Coding", "Robotics", "Web Design", "AI Basics", "Game Dev", "Cybersecurity"] }
];

const ratings = [];

app.get('/api/teachers', (req, res) => {
    const teachersWithRatings = teachers.map(teacher => {
        const teacherRatings = ratings.filter(r => r.teacher_id === teacher.id);
        const avgRating = teacherRatings.length
            ? teacherRatings.reduce((sum, r) => sum + r.rating, 0) / teacherRatings.length
            : null;
        return { ...teacher, avg_rating: avgRating, rating_count: teacherRatings.length };
    });
    res.json(teachersWithRatings);
});

app.get('/api/teachers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    
    const teacherRatings = ratings.filter(r => r.teacher_id === id);
    const avgRating = teacherRatings.length
        ? teacherRatings.reduce((sum, r) => sum + r.rating, 0) / teacherRatings.length
        : null;
    res.json({ ...teacher, avg_rating: avgRating, ratings: teacherRatings });
});

app.post('/api/ratings', (req, res) => {
    const { teacher_id, rating, review } = req.body;
    ratings.push({ teacher_id: parseInt(teacher_id), rating: parseInt(rating), review });
    res.json({ message: 'Rating submitted!' });
});

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'pages/home' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});