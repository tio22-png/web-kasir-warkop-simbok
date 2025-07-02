const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyToken } = require('./middleware');

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const [users] = await db.promise().query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Username atau password salah' });
        }
        
        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Username atau password salah' });
        }
        
        const token = jwt.sign(
            { id: user.id, role: user.role },
            'your-secret-key',  // In production, use environment variable
            { expiresIn: '1d' }
        );
        
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
