// Required packages
const express = require('express');
const mysql = require('mysql2/promise');
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
    console.log(req.body)
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
