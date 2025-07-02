const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'kasir'
});

// Coba connect kalau di local (tidak di-render)
if (process.env.NODE_ENV !== 'production') {
    connection.connect((err) => {
        if (err) {
            console.error('Database connection failed:', err.message);
        } else {
            console.log('Connected to MySQL');
        }
    });
}

module.exports = connection;
