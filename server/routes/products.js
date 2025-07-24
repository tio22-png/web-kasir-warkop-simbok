const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi multer untuk upload gambar
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/products';
        // Buat direktori jika belum ada
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate nama file unik dengan timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter file untuk menerima jpg dan jpeg
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        cb(null, true);
    } else {
        cb(new Error('Hanya file JPG yang diperbolehkan!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Batas ukuran file 5MB
    }
});

// Fungsi helper untuk memformat path gambar
const formatImagePath = (req, imagePath) => {
    if (!imagePath) return null;
    
    // Hapus 'uploads/products/' jika ada di awal path
    const cleanPath = imagePath.replace(/^uploads[\/\\]products[\/\\]/, '');
    
    // Hapus protocol dan host jika ada
    const finalPath = cleanPath.replace(/^https?:\/\/[^/]+\//, '');
    
    // Kembalikan URL lengkap
    return `${req.protocol}://${req.get('host')}/uploads/products/${finalPath}`;
};

// Middleware untuk mengatur static file serving
router.use('/uploads/products', express.static('uploads/products'));

// Get all products
router.get('/', async (req, res) => {
    try {
        const [products] = await db.promise().query('SELECT * FROM products');
        // Add base URL to image paths
        const formattedProducts = products.map(product => ({
            ...product,
            image: formatImagePath(req, product.image)
        }));
        res.json(formattedProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
    try {
        const category = req.params.category;
        
        // Map frontend categories to database categories
        const categoryMap = {
            'makanan': 'food',
            'minuman': 'drink'
        };
        
        const dbCategory = category === 'all' ? category : (categoryMap[category] || category);
        const query = dbCategory === 'all'
            ? 'SELECT * FROM products'
            : 'SELECT * FROM products WHERE category = ?';
        const [products] = await db.promise().query(query, dbCategory === 'all' ? [] : [dbCategory]);
        
        // Add base URL to image paths using helper function
        const formattedProducts = products.map(product => ({
            ...product,
            image: formatImagePath(req, product.image)
        }));
        
        res.json(formattedProducts);
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get product categories
router.get('/categories', async (req, res) => {
    try {
        res.json(['food', 'drink']);
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil kategori' });
    }
});

// Add new product
router.post('/', upload.single('image'), async (req, res) => {
    try {
        let { name, price, category, stock, jenis_produk = 'non-kemasan', tanggal_expired = null } = req.body;
        // Jika produk kemasan telah melewati tanggal kedaluwarsa, set stok menjadi 0 secara otomatis
        if (jenis_produk === 'kemasan' && tanggal_expired) {
            const today = new Date().toISOString().substring(0, 10);
            if (tanggal_expired <= today) {
                stock = 0;
            }
        }
        
        // Validasi kategori
        if (!['food', 'drink'].includes(category)) {
            return res.status(400).json({ message: 'Kategori tidak valid. Hanya food dan drink yang diperbolehkan.' });
        }

        const image = req.file ? req.file.path : null;
        
        const [result] = await db.promise().query(
            'INSERT INTO products (name, price, category, stock, image, jenis_produk, tanggal_expired) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, price, category, stock, image, jenis_produk, tanggal_expired]
        );
        
        res.status(201).json({
            id: result.insertId,
            name,
            price,
            category,
            stock,
            jenis_produk,
            tanggal_expired,
            image: image ? formatImagePath(req, image) : null
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat membuat produk' });
    }
});

// Update product
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        let { name, price, category, stock, jenis_produk = 'non-kemasan', tanggal_expired = null } = req.body;
        // Jika produk kemasan telah melewati tanggal kedaluwarsa, set stok menjadi 0 secara otomatis
        if (jenis_produk === 'kemasan' && tanggal_expired) {
            const today = new Date().toISOString().substring(0, 10);
            if (tanggal_expired <= today) {
                stock = 0;
            }
        }
        const { id } = req.params;

        // Validasi kategori
        if (!['food', 'drink'].includes(category)) {
            return res.status(400).json({ message: 'Kategori tidak valid. Hanya food dan drink yang diperbolehkan.' });
        }

        // Jika ada file gambar baru
        if (req.file) {
            // Hapus gambar lama jika ada
            const [oldProduct] = await db.promise().query('SELECT image FROM products WHERE id = ?', [id]);
            if (oldProduct[0]?.image) {
                fs.unlink(oldProduct[0].image, (err) => {
                    if (err) console.error('Error deleting old image:', err);
                });
            }

            // Update dengan gambar baru
            await db.promise().query(
                'UPDATE products SET name = ?, price = ?, category = ?, stock = ?, image = ?, jenis_produk = ?, tanggal_expired = ? WHERE id = ?',
                [name, price, category, stock, req.file.path, jenis_produk, tanggal_expired, id]
            );
        } else {
            // Update tanpa mengubah gambar
            await db.promise().query(
                'UPDATE products SET name = ?, price = ?, category = ?, stock = ?, jenis_produk = ?, tanggal_expired = ? WHERE id = ?',
                [name, price, category, stock, jenis_produk, tanggal_expired, id]
            );
        }

        // Ambil produk yang telah diperbarui
        const [updatedProduct] = await db.promise().query('SELECT * FROM products WHERE id = ?', [id]);

        res.json({
            ...updatedProduct[0],
            image: updatedProduct[0].image ? formatImagePath(req, updatedProduct[0].image) : null
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui produk' });
    }
});

// Update product stock
router.patch('/:id/stock', async (req, res) => {
    try {
        const { stock } = req.body;
        const [result] = await db.promise().query(
            'UPDATE products SET stock = ? WHERE id = ?',
            [stock, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }

        res.json({ message: 'Stok berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete product and related order_items to avoid FK constraint
router.delete('/:id', async (req, res) => {
    let connection;

    try {
                // Mulai transaksi
        connection = await db.promise();
        await connection.beginTransaction();

        // Ambil info produk sebelum dihapus
        const [product] = await db.promise().query(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );

        if (product.length === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }

        // Hapus file gambar jika ada
        if (product[0].image) {
            const imagePath = path.join(__dirname, '..', product[0].image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

                // Hapus order_items terkait terlebih dahulu untuk menghindari FK error
        await connection.query('DELETE FROM order_items WHERE product_id = ?', [req.params.id]);

        // Hapus data dari database
        const [result] = await connection.query(
            'DELETE FROM products WHERE id = ?',
            [req.params.id]
        );

        await connection.commit();

        res.json({ message: 'Produk berhasil dihapus' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error deleting product:', error);
        res.status(500).json({ message: error.message || 'Terjadi kesalahan saat menghapus produk' });
    }
});

module.exports = router;
