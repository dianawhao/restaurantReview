// Required packages
const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

require('dotenv').config();

// Express setup
const app = express();
app.use(express.json());
const port = 8080;

// Database connection setup
const pool = mysql.createPool({
    host:  process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});


function generateToken(userId, role) {
    return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}
function verifyToken(req, res, next) {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(403).send('No token provided');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send('Failed to authenticate token');
        }
        req.userId = decoded.id;
        req.role = decoded.role;
        next();
    });
}

function requireRole(role) {
    return function(req, res, next) {
        if (req.role !== role) {
            return res.status(403).send('Permission denied');
        }
        next();
    }
}

// RESTful routes with JWT

// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];

    if (user && user.password === password) {
        const token = generateToken(user.id, user.role);
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});


// Reviews
app.get('/reviews', verifyToken, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM reviews');
    res.json(rows);
});

app.post('/reviews', verifyToken, express.json(), async (req, res) => {
    if (req.role === 'user') {
        res.status(401);
				res.send('Denied');
        return;
    }
    const { restaurant_name, review_text, rating} = req.body;
    await pool.execute('INSERT INTO reviews (restaurant_name, review_text, rating) VALUES (?, ?, ?)', [restaurant_name, review_text, rating]);
    res.status(201).send('Review added');
});

app.put('/reviews/:id', verifyToken, express.json(), async (req, res) => {
   if (req.role === 'user') {
        res.status(401);
				res.send('Denied');
        return;
    }
    const id = req.params.id;
    const { restaurant_name, review_text, rating } = req.body;
    await pool.execute('UPDATE reviews SET restaurant_name = ?, review_text = ?, rating = ? WHERE id = ?', [restaurant_name, review_text, rating, id]);
    res.send('Review updated');
});

app.delete('/reviews/:id', verifyToken, async (req, res) => {
   if (req.role === 'user') {
        res.status(401);
				res.send('Denied');
        return;
    }
    const id = req.params.id;
    await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);
    res.send('Review deleted');
});

// User profile route
app.get('/user-profile', verifyToken, (req, res) => {
    if (req.role === 'user' || req.role === 'admin') {
        res.send('This is the user profile page');
    } else {
        res.status(403).send('Access denied');
    }
});



// RESTful routes

// GET - Fetch all reviews
app.get('/reviews', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM reviews');
    res.json(rows);
});


// PUT - Update a review
app.put('/reviews/:id', express.json(), async (req, res) => {
    const id = req.params.id;
    const { restaurant_name, review_text, rating } = req.body;
    await pool.execute('UPDATE reviews SET restaurant_name = ?, review_text = ?, rating = ? WHERE id = ?', [restaurant_name, review_text, rating, id]);
    res.send('Review updated');
});

// DELETE - Delete a review
app.delete('/reviews/:id', async (req, res) => {
    const id = req.params.id;
    await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);
    res.send('Review deleted');
});

// CREATE a new review
// POST /reviews
// body:
//  - restaurant_name : String
//  - review_text : String
//  - rating : float
app.post('/reviews', async function(req,res){
    //console.log(req.body)
    const query = `INSERT INTO reviews (restaurant_name, review_text, rating)
       VALUES (?, ?, ?)`;
    await pool.execute(query, [
        req.body.restaurant_name,
        req.body.review_text,
        req.body.rating
    ]);
    res.status(200).send("send successfully");
})

// Start the server
app.listen(port, () => {
    console.log(`Server running on <http://localhost>:${port}`);
});
