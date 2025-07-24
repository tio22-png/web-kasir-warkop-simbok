const express = require('express');
const router = express.Router();
const db = require('../db');

// Create new order
router.post('/', async (req, res) => {
    let connection;
    try {
        console.log('=======================================================');
        console.log('[POST /orders] Membuat pesanan baru');
        console.log('Request body:', JSON.stringify(req.body));
        
        const { items, total_amount, payment_method, customer_name, table_number, status, payment_status } = req.body;

        // Validasi input
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Items tidak boleh kosong');
        }

        if (!customer_name || !table_number) {
            throw new Error('Nama pelanggan dan nomor meja harus diisi');
        }

        connection = await db.promise();
        await connection.beginTransaction();
        console.log('[POST /orders] Transaksi dimulai');

        // Ambil semua stok produk terlebih dahulu
        const productIds = items.map(item => item.id);
        const [allProductStocks] = await connection.query(
            'SELECT id, stock FROM products WHERE id IN (?)',
            [productIds]
        );
        
        const stockMap = {};
        allProductStocks.forEach(p => {
            stockMap[p.id] = p.stock;
            console.log(`[POST /orders] Stok awal produk #${p.id}: ${p.stock}`);
        });

        // Validasi stok untuk semua items
        for (const item of items) {
            if (!stockMap[item.id]) {
                await connection.rollback();
                throw new Error(`Produk dengan ID ${item.id} tidak ditemukan`);
            }

            if (stockMap[item.id] < item.quantity) {
                await connection.rollback();
                throw new Error(`Stok tidak mencukupi untuk produk dengan ID ${item.id}`);
            }
        }
        
        // Create order
        const [orderResult] = await connection.query(
            'INSERT INTO orders (total_amount, payment_method, customer_name, table_number, status, payment_status) VALUES (?, ?, ?, ?, ?, ?)',
            [total_amount, payment_method, customer_name, table_number, status || 'pending', payment_status || 'pending']
        );
        
        const orderId = orderResult.insertId;
        console.log(`[POST /orders] Order dibuat dengan ID: ${orderId}`);
        
        // Add order items
        for (const item of items) {
            // Insert order item
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price, price_per_unit) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.id, item.quantity, item.price, item.price]
            );
            console.log(`[POST /orders] Item produk #${item.id} ditambahkan ke order, qty: ${item.quantity}`);
            
            // Hitung stok baru
            const newStock = Math.max(0, stockMap[item.id] - item.quantity);
            console.log(`[POST /orders] Produk #${item.id} - Stok awal: ${stockMap[item.id]}, Stok baru: ${newStock}, Jumlah dipesan: ${item.quantity}`);
            
            // Update stok produk SEKALI SAJA
            await connection.query(
                'UPDATE products SET stock = ? WHERE id = ?',
                [newStock, item.id]
            );
        }
        
        // Fetch the created order with items
        const [orders] = await connection.query(`
            SELECT 
                o.*,
                GROUP_CONCAT(
                    CONCAT(p.name, ' x', oi.quantity)
                    ORDER BY p.name
                    SEPARATOR ', '
                ) as items_summary
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.id = ?
            GROUP BY o.id
        `, [orderId]);

        console.log('[POST /orders] Transaksi berhasil, melakukan commit');
        await connection.commit();
        console.log('[POST /orders] Commit selesai, order berhasil dibuat');
        
        // Verifikasi final stok yang diupdate
        const [finalStocks] = await db.promise().query(
            'SELECT id, name, stock FROM products WHERE id IN (?)',
            [productIds]
        );
        
        console.log('[POST /orders] Verifikasi stok akhir:');
        finalStocks.forEach(p => {
            console.log(`Product #${p.id} ${p.name} - Stok akhir: ${p.stock}`);
        });
        console.log('=======================================================');
        
        res.status(201).json({ 
            message: 'Order created successfully',
            order: orders[0]
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error creating order:', error);
        res.status(500).json({ 
            message: error.message || 'Terjadi kesalahan saat membuat pesanan'
        });
    }
});

// Get all orders with items
router.get('/', async (req, res) => {
    try {
        const [orders] = await db.promise().query(`
            SELECT 
                o.*,
                GROUP_CONCAT(
                    CONCAT(p.name, ' x', oi.quantity)
                    ORDER BY p.name
                    SEPARATOR ', '
                ) as items_summary
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);

        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ 
            message: error.message || 'Terjadi kesalahan saat mengambil data pesanan'
        });
    }
});

// Get all payments
router.get('/payments', async (req, res) => {
    try {
        const [payments] = await db.promise().query(`
            SELECT 
                o.*,
                GROUP_CONCAT(
                    CONCAT(p.name, ' x', oi.quantity)
                    ORDER BY p.name
                    SEPARATOR ', '
                ) as items_summary
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            GROUP BY o.id
            ORDER BY 
                CASE 
                    WHEN o.payment_status = 'pending' OR o.payment_status = 'unpaid' THEN 0
                    ELSE 1
                END,
                o.created_at DESC
        `);
        
        // Normalize payment status untuk konsistensi di frontend
        const normalizedPayments = payments.map(payment => {
            // Jika status 'unpaid', ubah menjadi 'pending' untuk konsistensi
            if (payment.payment_status === 'unpaid') {
                console.log(`Normalizing payment #${payment.id} status from 'unpaid' to 'pending'`);
                return { ...payment, payment_status: 'pending' };
            }
            return payment;
        });
        
        res.json(normalizedPayments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ 
            message: error.message || 'Terjadi kesalahan saat mengambil data pembayaran'
        });
    }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Konversi status ke lowercase untuk konsistensi
        const normalizedStatus = status.toLowerCase();
        
        // Daftar status yang valid
        const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'rejected', 'selesai', 'diproses', 'dibatalkan', 'ditolak'];
        
        if (!validStatuses.includes(normalizedStatus)) {
            throw new Error('Status tidak valid. Status yang valid: pending, processing, completed, cancelled, rejected, selesai, diproses, dibatalkan, ditolak');
        }

        // Mapping status Indonesia ke English jika diperlukan
        const statusMapping = {
            'selesai': 'completed',
            'diproses': 'processing',
            'dibatalkan': 'cancelled',
            'ditolak': 'rejected'
        };

        const finalStatus = statusMapping[normalizedStatus] || normalizedStatus;

        connection = await db.promise();
        await connection.beginTransaction();
        
        await connection.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [finalStatus, id]
        );
        
        await connection.commit();
        res.json({ message: 'Status pesanan berhasil diperbarui' });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error updating order status:', error);
        res.status(500).json({ 
            message: error.message || 'Terjadi kesalahan saat memperbarui status pesanan'
        });
    }
});

// Update payment status
router.patch('/:id/payment', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { payment_status } = req.body;
        
        if (!['pending', 'paid'].includes(payment_status)) {
            throw new Error('Status pembayaran tidak valid');
        }

        connection = await db.promise();
        await connection.beginTransaction();
        
        await connection.query(
            'UPDATE orders SET payment_status = ? WHERE id = ?',
            [payment_status, id]
        );
        
        await connection.commit();
        res.json({ message: 'Status pembayaran berhasil diperbarui' });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error updating payment status:', error);
        res.status(500).json({ 
            message: error.message || 'Terjadi kesalahan saat memperbarui status pembayaran'
        });
    }
});

// Get sales report data - untuk komponen Laporan Penjualan
router.get('/sales-report', async (req, res) => {
    try {
        // Parse tanggal dari query parameters
        const { startDate, endDate } = req.query;
        
        // Validasi parameter
        if (!startDate || !endDate) {
            return res.status(400).json({ 
                message: 'Parameter startDate dan endDate diperlukan' 
            });
        }
        
        // Format tanggal untuk query MySQL (YYYY-MM-DD)
        const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
        const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
        
        console.log(`[GET /orders/sales-report] Mengambil data penjualan dari ${formattedStartDate} hingga ${formattedEndDate}`);
        
        // Debug: Periksa semua pesanan yang ada dengan status pembayaran apapun
        const [allOrders] = await db.promise().query(`SELECT id, payment_status, created_at, total_amount FROM orders`);
        console.log('DEBUG - Semua pesanan di database:', allOrders);
        
        // Debug: Periksa pesanan khusus dengan status paid atau Lunas
        const [paidOrders] = await db.promise().query(`SELECT id, payment_status, created_at, total_amount FROM orders WHERE payment_status = 'paid' OR payment_status = 'Lunas'`);
        console.log('DEBUG - Pesanan dengan status paid/Lunas:', paidOrders);
        
        // Query untuk mendapatkan data penjualan harian dalam rentang tanggal
        const [dailySales] = await db.promise().query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as sales,
                SUM(total_amount) as revenue
            FROM orders 
            WHERE 
                DATE(created_at) BETWEEN ? AND ? 
                AND (payment_status = 'paid' OR payment_status = 'Lunas' OR payment_status = 'lunas' OR payment_status = 'PAID' OR payment_status = 'LUNAS')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [formattedStartDate, formattedEndDate]);
        
        console.log('Daily Sales Data:', dailySales);
        
        // Query untuk mendapatkan data produk terjual dalam rentang tanggal (nama produk & jumlah)
        const [productsSummary] = await db.promise().query(`
            SELECT 
                p.id,
                p.name,
                SUM(oi.quantity) AS total_sold
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            JOIN products p ON p.id = oi.product_id
            WHERE 
                DATE(o.created_at) BETWEEN ? AND ?
                AND (o.payment_status = 'paid' OR o.payment_status = 'Lunas' OR o.payment_status = 'lunas' OR o.payment_status = 'PAID' OR o.payment_status = 'LUNAS')
            GROUP BY p.id
            ORDER BY total_sold DESC
        `, [formattedStartDate, formattedEndDate]);
        
        console.log('Products Summary:', productsSummary);
        
        // Query untuk mendapatkan total penjualan dalam rentang tanggal
        const [totalSummary] = await db.promise().query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue
            FROM orders 
            WHERE 
                DATE(created_at) BETWEEN ? AND ? 
                AND (payment_status = 'paid' OR payment_status = 'Lunas' OR payment_status = 'lunas' OR payment_status = 'PAID' OR payment_status = 'LUNAS')
        `, [formattedStartDate, formattedEndDate]);
        
        console.log('Total Summary:', totalSummary);
        
        // Jika tidak ada data, kirim array kosong dengan total 0
        if (!dailySales.length) {
            return res.json({
                dailySales: [],
                summary: {
                    totalOrders: 0,
                    totalRevenue: 0
                },
                productsSummary: []
            });
        }
        
        // Format respons
        const response = {
            dailySales: dailySales,
            summary: {
                totalOrders: totalSummary[0].total_orders,
                totalRevenue: totalSummary[0].total_revenue
            },
            productsSummary
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ 
            message: error.message || 'Terjadi kesalahan saat menghasilkan laporan penjualan'
        });
    }
});

module.exports = router;
