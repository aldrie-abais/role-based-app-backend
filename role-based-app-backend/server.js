const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-very-secure-secret'; // In production, use environment variables!

// 1. Enable CORS for frontend (Allows your HTML file to talk to this server)
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'] // Change 5500 if your Live Server uses a different port!
}));

app.use(express.json());

// 2. In-memory "database" (Simulating a real database like MySQL)
let users = [
    { id: 1, username: 'admin', password: '', role: 'admin' },
    { id: 2, username: 'alice', password: '', role: 'user' }
];

// Pre-hash known passwords for our demo users
users[0].password = bcrypt.hashSync('admin123', 10);
users[1].password = bcrypt.hashSync('user123', 10);

// =======================
// 3. AUTH ROUTES (Login & Register)
// =======================

// POST /api/register
app.post('/api/register', async (req, res) => {
    const { username, password, role = 'user' } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const existing = users.find(u => u.username === username);
    if (existing) {
        return res.status(409).json({ error: 'User already exists' });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: users.length + 1,
        username,
        password: hashedPassword,
        role // Note: In real apps, role should NOT be set by the client!
    };

    users.push(newUser);
    res.status(201).json({ message: 'User registered', username, role });
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    
    // Check if user exists AND if the typed password matches the hashed password
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate a JWT token valid for 1 hour
    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: '1h' }
    );

    res.json({ token, user: { username: user.username, role: user.role } });
});

// =======================
// 4. SECURITY MIDDLEWARE (The Bouncers)
// =======================

// Checks if the user has a valid JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format is "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

// Checks if the logged-in user has the specific role required
function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Access denied: insufficient permissions' });
        }
        next();
    };
}

// =======================
// 5. PROTECTED ROUTES
// =======================

app.get('/api/profile', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// This route requires BOTH a valid token AND the 'admin' role
app.get('/api/admin/dashboard', authenticateToken, authorizeRole('admin'), (req, res) => {
    res.json({ message: 'Welcome to admin dashboard!', data: 'Secret admin info' });
});

app.get('/api/content/guest', (req, res) => {
    res.json({ message: 'Public content for all visitors' });
});

// =======================
// 6. START SERVER
// =======================
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log(`Try logging in with:`);
    console.log(`- Admin: username=admin, password=admin123`);
    console.log(`- User: username=alice, password=user123`);
});