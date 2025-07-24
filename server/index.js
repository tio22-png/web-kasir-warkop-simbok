const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer'); // tambahkan require multer
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const expiredStockScheduler = require('./schedulers/expiredStockScheduler');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(express.json());

// CORS Headers Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    return res.status(200).json({});
  }
  next();
});

// Serve static files dari folder uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Tambahkan middleware error handling untuk file upload
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Error dari Multer
    return res.status(400).json({
      message: 'Error saat upload file: ' + err.message
    });
  } else if (err) {
    // Error lainnya
    return res.status(500).json({
      message: 'Terjadi kesalahan: ' + err.message
    });
  }
  next();
});

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'kasir'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
// Mulai scheduler setelah server siap
expiredStockScheduler.start();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
