const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyToken } = require('./middleware');

// Login
// Endpoint: POST /api/auth/login – menangani proses autentikasi pengguna
router.post('/login', async (req, res) => {
    try {
        // 1) Ambil username & password yang dikirim dari form login
        const { username, password } = req.body;
        
        const [users] = await db.promise().query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Username atau password salah' });
        }
        
        const user = users[0];
        // 4) Bandingkan password plaintext dengan hash di database
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        // Jika password salah → kirim error 401
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Username atau password salah' });
        }
        
        // 5) Password cocok → buat JSON Web Token (JWT) yang berlaku 1 hari
        const token = jwt.sign(
            { id: user.id, role: user.role },
            'your-secret-key',  // In production, use environment variable
            { expiresIn: '1d' }
        );
        
        // 6) Kirim token & info user ke frontend
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal melakukan login: ' + error.message });
    }
});

// Verify token and get user info
router.get('/verify', verifyToken, async (req, res) => {
    try {
        const [users] = await db.promise().query(
            'SELECT id, username, role FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }
        
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memverifikasi token: ' + error.message });
    }
});

module.exports = router;
