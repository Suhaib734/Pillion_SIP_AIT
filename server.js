const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- DATABASE CONNECTION ---
// ⚠️ REPLACE 'password' WITH YOUR REAL MYSQL PASSWORD
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root', 
    database: 'pillion_db'
});

db.connect(err => {
    if (err) console.error('❌ DB Connection Failed:', err.message);
    else console.log(' Pillion Brain Connected to MySQL');
});

// 1. GENERATE OTP API
app.post('/api/auth/send-otp', (req, res) => {
    const { mobile } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000); // Generate 4-digit code

    const sql = `INSERT INTO users (mobile_number, otp_code) VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE otp_code = ?`;
    
    db.query(sql, [mobile, otp, otp], (err, result) => {
        if (err) return res.status(500).json({ error: "DB Error" });
        
        console.log(`\n================================`);
        console.log(`📲 LOGIN REQUEST: ${mobile}`);
        console.log(`🔐 OTP GENERATED: ${otp}`);
        console.log(`================================\n`);
        
        res.json({ success: true, message: "OTP Sent" });
    });
});

// 2. VERIFY OTP API
app.post('/api/auth/verify-otp', (req, res) => {
    const { mobile, otp } = req.body;
    const sql = `SELECT * FROM users WHERE mobile_number = ? AND otp_code = ?`;
    
    db.query(sql, [mobile, otp], (err, results) => {
        if (results.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Invalid OTP" });
        }
    });
});

// 3. BOOK RIDE API
app.post('/api/rides/book', (req, res) => {
    const { userMobile, friendName, friendMobile, pickup, drop, type, price } = req.body;

    const sql = `INSERT INTO bookings (user_mobile, friend_name, friend_mobile, pickup_loc, drop_loc, ride_type, price) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    // friendName/Mobile will be null if booking for self
    db.query(sql, [userMobile, friendName || null, friendMobile || null, pickup, drop, type, price], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        console.log(`🚖 RIDE BOOKED: ${type} - ₹${price}`);
        if(friendName) console.log(`   ↳ 👤 BOOKED FOR FRIEND: ${friendName}`);
        
        res.json({ success: true, bookingId: result.insertId });
    });
});

app.listen(5000, () => {
    console.log(" Server running on http://localhost:5000");
});