const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifyToken, verifyAdmin } = require('./middleware');

// Get all users (admin only)
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [users] = await db.promise().query(
            'SELECT id, username, email, role, created_at FROM users'
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data pengguna: ' + error.message });
    }
});

// Get user by ID (admin only)
router.get('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [users] = await db.promise().query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [req.params.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }
        
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data pengguna: ' + error.message });
    }
});

// Create new user (admin only)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validasi input
        if (!username || !password || !role || !email) {
            return res.status(400).json({ message: 'Semua field harus diisi' });
        }

        // Cek username dan email sudah ada
        const [existingUsers] = await db.promise().query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Nama pengguna atau alamat email sudah digunakan' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await db.promise().query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role]
        );

        res.status(201).json({
            message: 'Pengguna berhasil dibuat',
            userId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal membuat pengguna: ' + error.message });
    }
});

// Update user (admin only)
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const userId = req.params.id;

        // Cek user exists
        const [existingUser] = await db.promise().query(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (existingUser.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }

        // Cek username dan email sudah ada (kecuali untuk user yang sedang diupdate)
        if (username) {
            const [existingUsername] = await db.promise().query(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, userId]
            );

            if (existingUsername.length > 0) {
                return res.status(400).json({ message: 'Nama pengguna sudah digunakan' });
            }
        }

        if (email) {
            const [existingEmail] = await db.promise().query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );

            if (existingEmail.length > 0) {
                return res.status(400).json({ message: 'Alamat email sudah digunakan' });
            }
        }

        // Update user
        let updateQuery = 'UPDATE users SET ';
        const updateValues = [];
        const updates = [];

        if (username) {
            updates.push('username = ?');
            updateValues.push(username);
        }

        if (email) {
            updates.push('email = ?');
            updateValues.push(email);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            updateValues.push(hashedPassword);
        }

        if (role) {
            updates.push('role = ?');
            updateValues.push(role);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'Tidak ada data yang diupdate' });
        }

        updateQuery += updates.join(', ') + ' WHERE id = ?';
        updateValues.push(userId);

        const [result] = await db.promise().query(updateQuery, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }

        res.json({ message: 'Pengguna berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui pengguna: ' + error.message });
    }
});

// Delete user (admin only)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [result] = await db.promise().query(
            'DELETE FROM users WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }

        res.json({ message: 'Pengguna berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus pengguna: ' + error.message });
    }
});

// Get current user profile
router.get('/profile/me', verifyToken, async (req, res) => {
    try {
        const [users] = await db.promise().query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }
        
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil profil: ' + error.message });
    }
});

// Change password (for current user)
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validasi input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Password lama dan baru harus diisi' });
        }

        // Ambil data user
        const [users] = await db.promise().query(
            'SELECT * FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }

        const user = users[0];

        // Verifikasi password lama
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Password lama salah' });
        }

        // Hash password baru
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.promise().query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );

        res.json({ message: 'Password berhasil diubah' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengubah password: ' + error.message });
    }
});

module.exports = router;
