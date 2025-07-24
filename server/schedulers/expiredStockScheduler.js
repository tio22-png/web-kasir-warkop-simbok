const cron = require('node-cron');
const db = require('../db');

/**
 * Cron job untuk mengecek produk kemasan yang sudah kedaluwarsa
 * dan otomatis mengatur stoknya menjadi 0.
 *
 * Jadwal: Setiap hari pukul 00:05 WIB (Asia/Jakarta time-zone).
 */
async function updateExpiredPackageStock() {
  try {
    const [result] = await db.promise().query(
      "UPDATE products SET stock = 0 WHERE jenis_produk = 'kemasan' AND tanggal_expired IS NOT NULL AND tanggal_expired <= CURDATE() AND stock > 0"
    );
    if (result.affectedRows) {
      console.log(`❗️ [Scheduler] Stok di-nol-kan untuk ${result.affectedRows} produk kemasan kedaluwarsa.`);
    }
  } catch (error) {
    console.error('[Scheduler] Gagal memperbarui stok produk kedaluwarsa:', error);
  }
}

// Jalankan sekali saat server menyala
updateExpiredPackageStock();

// Jadwalkan pengecekan harian pukul 00:05 WIB
const task = cron.schedule('5 0 * * *', updateExpiredPackageStock, {
  scheduled: false,
  timezone: 'Asia/Jakarta'
});

module.exports = task;
