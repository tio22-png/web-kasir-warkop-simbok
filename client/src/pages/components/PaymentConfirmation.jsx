import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import isWithinInterval from 'date-fns/isWithinInterval';
import subDays from 'date-fns/subDays';
import startOfDay from 'date-fns/startOfDay';
import endOfDay from 'date-fns/endOfDay';
import id from 'date-fns/locale/id';

// Helper function untuk memformat tanggal untuk tampilan
const formatDisplayDate = (isoDate) => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // Format DD/MM/YYYY
  }
  return isoDate;
};

// Konversi dari format DD/MM/YYYY ke YYYY-MM-DD
const createISODate = (day, month, year) => {
  if (!day || !month || !year || year.length !== 4) return '';
  
  // Pad dengan 0 jika perlu
  const paddedDay = day.padStart(2, '0');
  const paddedMonth = month.padStart(2, '0');
  
  return `${year}-${paddedMonth}-${paddedDay}`;
};

// Ekstrak bagian dari tanggal ISO
const extractDateParts = (isoDate) => {
  if (!isoDate) return { day: '', month: '', year: '' };
  
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return {
      year: parts[0],
      month: parts[1].replace(/^0/, ''), // Hapus 0 di depan
      day: parts[2].replace(/^0/, '')    // Hapus 0 di depan
    };
  }
  
  return { day: '', month: '', year: '' };
};

const PaymentConfirmation = ({ data, orderActions, refreshData }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'paid', 'pending'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  
  // Inisialisasi state dengan tanggal sekarang dan 7 hari yang lalu
  const defaultStartDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const defaultEndDate = format(new Date(), 'yyyy-MM-dd');
  
  // Extract tanggal ke bagian-bagian terpisah
  const startParts = extractDateParts(defaultStartDate);
  const endParts = extractDateParts(defaultEndDate);
  
  const [customDateRange, setCustomDateRange] = useState({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    startDay: startParts.day,
    startMonth: startParts.month,
    startYear: startParts.year,
    endDay: endParts.day,
    endMonth: endParts.month,
    endYear: endParts.year
  });
  
  // Fungsi untuk update tanggal mulai
  const updateStartDate = (part, value) => {
    const updates = { ...customDateRange, [`start${part.charAt(0).toUpperCase() + part.slice(1)}`]: value };
    
    // Update ISO date jika semua bagian terisi
    if (updates.startDay && updates.startMonth && updates.startYear && updates.startYear.length === 4) {
      updates.startDate = createISODate(updates.startDay, updates.startMonth, updates.startYear);
    }
    
    setCustomDateRange(updates);
  };
  
  // Fungsi untuk update tanggal akhir
  const updateEndDate = (part, value) => {
    const updates = { ...customDateRange, [`end${part.charAt(0).toUpperCase() + part.slice(1)}`]: value };
    
    // Update ISO date jika semua bagian terisi
    if (updates.endDay && updates.endMonth && updates.endYear && updates.endYear.length === 4) {
      updates.endDate = createISODate(updates.endDay, updates.endMonth, updates.endYear);
    }
    
    setCustomDateRange(updates);
  };
  
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cashInputs, setCashInputs] = useState({});

  const handleCashChange = (orderId, value) => {
    const numeric = value.replace(/[^0-9]/g, '');
    setCashInputs(prev => ({ ...prev, [orderId]: numeric }));
  };

  // Debug data yang diterima
  useEffect(() => {
    if (Array.isArray(data)) {
      console.log(`PaymentConfirmation received ${data.length} items:`, data);
      
      // Secara otomatis aktifkan filter 'pending' jika ada pesanan baru (status 'unpaid')
      const hasPendingOrders = data.some(item => item.payment_status === 'pending' || item.payment_status === 'unpaid');
      if (hasPendingOrders && activeFilter === 'all') {
        console.log('Found pending orders, automatically setting filter to pending');
        setActiveFilter('pending');
      }
    } else {
      console.log('PaymentConfirmation received invalid data:', data);
    }
  }, [data]);

  // Filter data berdasarkan status pembayaran, tanggal, dan pencarian teks
  useEffect(() => {
    if (!Array.isArray(data)) {
      setFilteredData([]);
      return;
    }

    console.log(`Filtering data with activeFilter: ${activeFilter} and searchQuery: ${searchQuery}`, data);
    
    // Filter berdasarkan status pembayaran
    let filtered = data;
    if (activeFilter !== 'all') {
      filtered = data.filter(item => {
        // Tangani 'unpaid' sebagai 'pending' untuk kompatibilitas
        const itemStatus = item.payment_status === 'unpaid' ? 'pending' : item.payment_status;
        console.log(`Item #${item.id} payment_status: ${item.payment_status} (normalized: ${itemStatus}), match: ${itemStatus === activeFilter}`);
        return itemStatus === activeFilter;
      });
    }
    
    // Filter berdasarkan tanggal
    if (dateFilter !== 'all') {
      const today = new Date();
      let startDateFilter, endDateFilter;
      
      switch (dateFilter) {
        case 'today':
          startDateFilter = startOfDay(today);
          endDateFilter = endOfDay(today);
          break;
        case 'week':
          startDateFilter = startOfDay(subDays(today, 7));
          endDateFilter = endOfDay(today);
          break;
        case 'month':
          startDateFilter = startOfDay(subDays(today, 30));
          endDateFilter = endOfDay(today);
          break;
        case 'custom':
          if (customDateRange.startDate && customDateRange.endDate) {
            startDateFilter = startOfDay(new Date(customDateRange.startDate));
            endDateFilter = endOfDay(new Date(customDateRange.endDate));
          }
          break;
        default:
          break;
      }
      
      if (startDateFilter && endDateFilter) {
        filtered = filtered.filter(item => {
          if (!item.created_at) return false;
          
          try {
            const itemDate = parseISO(item.created_at);
            return isWithinInterval(itemDate, {
              start: startDateFilter,
              end: endDateFilter
            });
          } catch (error) {
            console.error('Error parsing date:', item.created_at, error);
            return false;
          }
        });
      }
    }
    
    // Filter berdasarkan pencarian teks
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        // Filter berdasarkan nama depan pelanggan
        if (item.customer_name) {
          const customerName = item.customer_name.toLowerCase();
          // Cek apakah nama pelanggan dimulai dengan query
          if (customerName.startsWith(query)) {
            return true;
          }
        }
        
        // Filter tambahan untuk nomor pesanan dan item summary
        // tetap menggunakan includes untuk kasus pencarian lainnya
        const orderIdMatch = item.id?.toString().includes(query);
        const itemsSummaryMatch = item.items_summary?.toLowerCase().includes(query);
        
        return orderIdMatch || itemsSummaryMatch;
      });
    }
    
    // Sort data - Terbaru di atas
    filtered = [...filtered].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    setFilteredData(filtered);
  }, [data, activeFilter, dateFilter, customDateRange, searchQuery]);

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy - HH:mm', { locale: id });
    } catch (error) {
      return dateString || 'Tanggal tidak valid';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Belum Dibayar';
      case 'paid':
        return 'Lunas';
      case 'canceled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-accent/10 text-accent border-accent/30';
      case 'paid':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleUpdateStatus = async (payment, newStatus) => {
    // Jika payment status 'paid' dan mencoba set ke 'paid' lagi, tampilkan error
    if (payment.payment_status === 'paid' && newStatus === 'paid') {
      Swal.fire({
        icon: 'info',
        title: 'Info',
        text: 'Pesanan ini sudah dalam status Lunas',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }
    
    // Handle 'unpaid' sebagai 'pending' untuk kompatibilitas
    const currentStatus = payment.payment_status === 'unpaid' ? 'pending' : payment.payment_status;

    // Jika status 'paid', konfirmasi tambahan untuk perubahan ke 'pending'
    if (currentStatus === 'paid' && newStatus === 'pending') {
      const confirmResult = await Swal.fire({
        title: 'Ubah Status Pembayaran',
        text: 'Anda yakin ingin mengubah status pembayaran ini dari Lunas menjadi Belum Dibayar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Ubah Status',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#FF8C00'
      });

      if (!confirmResult.isConfirmed) {
        return;
      }
    }

    try {
      const confirmResult = await Swal.fire({
        title: `Konfirmasi ${newStatus === 'paid' ? 'Pembayaran' : 'Status'}`,
        text: `Apakah Anda yakin ingin ${newStatus === 'paid' ? 'menandai pembayaran ini sebagai lunas' : 'mengubah status pembayaran ini menjadi belum dibayar'}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Konfirmasi',
        cancelButtonText: 'Batal',
        confirmButtonColor: newStatus === 'paid' ? '#6F4E37' : '#FF8C00'
      });

      if (confirmResult.isConfirmed) {
        // Update status pembayaran
        console.log(`Updating payment status for order #${payment.id} to ${newStatus}`);
        // Pastikan status pembayaran selalu konsisten (gunakan 'paid' untuk lunas)
        const finalStatus = newStatus === 'paid' ? 'paid' : 'pending';
        console.log(`Normalized payment status: ${finalStatus}`);
        await orderActions.updatePayment(payment.id, finalStatus);
        
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: newStatus === 'paid' 
            ? 'Pembayaran berhasil dikonfirmasi lunas' 
            : 'Status pembayaran berhasil diubah menjadi belum dibayar',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        
        // Refresh data dengan delay kecil untuk memastikan API sudah diupdate
        setTimeout(() => refreshData(), 500);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal mengubah status pembayaran',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-center py-8 text-text">
        Tidak ada pembayaran yang perlu dikonfirmasi
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-primary">Konfirmasi Pembayaran</h2>
        <div className="flex flex-wrap w-full sm:w-auto gap-2 sm:space-x-2">
          <button
            onClick={refreshData}
            className="px-3 sm:px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center text-sm sm:text-base flex-1 sm:flex-none justify-center sm:justify-start"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="px-3 sm:px-4 py-2 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors flex items-center text-sm sm:text-base flex-1 sm:flex-none justify-center sm:justify-start"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Filter Tanggal
          </button>
        </div>
      </div>

      {/* Input Pencarian */}
      <div className="mb-4 relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama pelanggan atau nomor pesanan..."
            className="w-full py-2.5 pl-10 pr-4 bg-white text-text rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm text-sm sm:text-base"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-xs sm:text-sm text-primary font-medium">
            Mencari: "{searchQuery}"
          </p>
        )}
      </div>
      
      {/* Filter Status Pembayaran - layout responsif */}
      <div className="flex flex-wrap gap-2 w-full mb-4">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 sm:px-4 py-2 rounded-lg flex-1 sm:flex-none text-sm sm:text-base transition-all duration-200 ${activeFilter === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-background-card text-primary hover:bg-primary/10'}`}
        >
          Semua
        </button>
        <button
          onClick={() => setActiveFilter('paid')}
          className={`px-3 sm:px-4 py-2 rounded-lg flex-1 sm:flex-none text-sm sm:text-base transition-all duration-200 ${activeFilter === 'paid' ? 'bg-primary text-white shadow-sm' : 'bg-background-card text-primary hover:bg-primary/10'}`}
        >
          Lunas
        </button>
        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-3 sm:px-4 py-2 rounded-lg flex-1 sm:flex-none text-sm sm:text-base transition-all duration-200 ${activeFilter === 'pending' ? 'bg-accent text-white shadow-sm' : 'bg-background-card text-accent hover:bg-accent/10'}`}
        >
          Belum Dibayar
        </button>
      </div>

      {activeFilter !== 'all' && (
        <p className="text-xs sm:text-sm mb-3 sm:mb-4 text-primary font-medium">
          Menampilkan pesanan dengan status: {activeFilter === 'paid' ? 'Lunas' : 'Belum Dibayar'}
        </p>
      )}

      <AnimatePresence>
        {showDateFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-background-card p-6 rounded-lg shadow-md border border-primary/10"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-primary mb-2">Filter Berdasarkan Tanggal</h3>
              <p className="text-text text-sm mb-4">Pilih rentang tanggal untuk memfilter status pembayaran:</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  dateFilter === 'all'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-background-card text-primary hover:bg-primary/10'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  dateFilter === 'today'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-background-card text-primary hover:bg-primary/10'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  dateFilter === 'week'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-background-card text-primary hover:bg-primary/10'
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  dateFilter === 'month'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-background-card text-primary hover:bg-primary/10'
                }`}
              >
                30 Hari Terakhir
              </button>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-primary font-medium mb-3">Pilih Tanggal Kustom:</h4>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex flex-col w-full sm:w-auto">
                  <label className="text-sm text-text mb-1">Tanggal Mulai:</label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Input Hari */}
                    <div className="relative w-14 sm:w-16">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="DD"
                        maxLength="2"
                        value={customDateRange.startDay || ''}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length > 2) value = value.slice(0, 2);
                          // Validasi hari (1-31)
                          if (value && parseInt(value) > 31) value = '31';
                          if (value && parseInt(value) < 1) value = '1';
                          
                          updateStartDate('day', value);
                        }}
                        className="form-input w-full px-2 py-2.5 text-center border border-gray-300 text-text bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    
                    <span className="text-gray-500">/</span>
                    
                    {/* Input Bulan */}
                    <div className="relative w-14 sm:w-16">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="MM"
                        maxLength="2"
                        value={customDateRange.startMonth || ''}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length > 2) value = value.slice(0, 2);
                          // Validasi bulan (1-12)
                          if (value && parseInt(value) > 12) value = '12';
                          if (value && parseInt(value) < 1) value = '1';
                          
                          updateStartDate('month', value);
                        }}
                        className="form-input w-full px-2 py-2.5 text-center border border-gray-300 text-text bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    
                    <span className="text-gray-500">/</span>
                    
                    {/* Input Tahun */}
                    <div className="relative w-20 sm:w-24">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="YYYY"
                        maxLength="4"
                        value={customDateRange.startYear || ''}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length > 4) value = value.slice(0, 4);
                          
                          updateStartDate('year', value);
                        }}
                        className="form-input w-full px-2 py-2.5 text-center border border-gray-300 text-text bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <span className="hidden sm:block text-text font-medium">-</span>

                <div className="flex flex-col w-full sm:w-auto">
                  <label className="text-sm text-text mb-1">Tanggal Akhir:</label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Input Hari */}
                    <div className="relative w-14 sm:w-16">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="DD"
                        maxLength="2"
                        value={customDateRange.endDay || ''}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length > 2) value = value.slice(0, 2);
                          // Validasi hari (1-31)
                          if (value && parseInt(value) > 31) value = '31';
                          if (value && parseInt(value) < 1) value = '1';
                          
                          updateEndDate('day', value);
                        }}
                        className="form-input w-full px-2 py-2.5 text-center border border-gray-300 text-text bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    
                    <span className="text-gray-500">/</span>
                    
                    {/* Input Bulan */}
                    <div className="relative w-14 sm:w-16">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="MM"
                        maxLength="2"
                        value={customDateRange.endMonth || ''}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length > 2) value = value.slice(0, 2);
                          // Validasi bulan (1-12)
                          if (value && parseInt(value) > 12) value = '12';
                          if (value && parseInt(value) < 1) value = '1';
                          
                          updateEndDate('month', value);
                        }}
                        className="form-input w-full px-2 py-2.5 text-center border border-gray-300 text-text bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    
                    <span className="text-gray-500">/</span>
                    
                    {/* Input Tahun */}
                    <div className="relative w-20 sm:w-24">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="YYYY"
                        maxLength="4"
                        value={customDateRange.endYear || ''}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length > 4) value = value.slice(0, 4);
                          
                          updateEndDate('year', value);
                        }}
                        className="form-input w-full px-2 py-2.5 text-center border border-gray-300 text-text bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setDateFilter('custom')}
                  className={`mt-4 sm:mt-0 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    dateFilter === 'custom'
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  Terapkan Filter
                </button>
              </div>
            </div>

            {dateFilter !== 'all' && (
              <div className="mt-4 pt-3 border-t border-gray-200 text-sm text-primary font-medium">
                Filter Aktif: {dateFilter === 'today' ? 'Hari Ini' : 
                              dateFilter === 'week' ? '7 Hari Terakhir' : 
                              dateFilter === 'month' ? '30 Hari Terakhir' : 
                              dateFilter === 'custom' ? `${customDateRange.startDate} - ${customDateRange.endDate}` : 'Semua'}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 sm:space-y-4">
        {filteredData.map(payment => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={payment.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 sm:gap-0 mb-3 sm:mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-primary">Order #{payment.id}</h3>
                  <p className="text-xs sm:text-sm text-text-light">Dibuat: {formatDate(payment.created_at)}</p>
                  <p className="text-xs sm:text-sm font-medium mt-1">{payment.customer_name}</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-lg sm:text-xl font-bold text-primary">Rp {payment.total_amount?.toLocaleString('id-ID')}</div>
                  <div className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full inline-block mt-1 ${getStatusClass(payment.payment_status)}`}>
                    {getStatusLabel(payment.payment_status)}
                  </div>
                </div>
              </div>

              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-sm text-gray-700">
                  Items: {payment.items_summary || 'Tidak ada detail item'}
                </p>
              </div>

              <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:space-x-2">
                {payment.payment_status !== 'paid' && (
                  <button
                    onClick={() => handleUpdateStatus(payment, 'paid')}
                    disabled={parseInt(cashInputs[payment.id] || 0) < payment.total_amount}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors shadow-sm flex-1 sm:flex-none ${parseInt(cashInputs[payment.id] || 0) < payment.total_amount ? 'bg-primary/50 text-white cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark'}`}
                  >
                    Konfirmasi Lunas
                  </button>
                )}

                {payment.payment_status === 'paid' && (
                  <button
                    onClick={() => handleUpdateStatus(payment, 'pending')}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-accent text-white text-xs sm:text-sm rounded-lg hover:bg-accent-dark transition-colors shadow-sm flex-1 sm:flex-none"
                  >
                    Tandai Belum Dibayar
                  </button>
                )}
              </div>

              {payment.payment_status !== 'paid' && (
                <div className="mt-3 w-full">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Uang Pembeli
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Masukkan nominal uang"
                    value={cashInputs[payment.id] || ''}
                    onChange={(e) => handleCashChange(payment.id, e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-900"
                  />
                  <p className="text-xs sm:text-sm mt-2">
                    Total Belanja: Rp {payment.total_amount?.toLocaleString('id-ID')}
                  </p>
                  {parseInt(cashInputs[payment.id] || 0) >= payment.total_amount ? (
                    <p className="text-xs sm:text-sm font-semibold text-primary">
                      Kembalian: Rp {(parseInt(cashInputs[payment.id] || 0) - payment.total_amount).toLocaleString('id-ID')}
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm text-red-600">
                      Nominal uang tidak mencukupi untuk total belanja.
                    </p>
                  )}
                </div>
              )}
             </div>
          </motion.div>
        ))}

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-text bg-background-card rounded-lg shadow-sm border border-gray-200">
            Tidak ada pembayaran yang sesuai dengan filter
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentConfirmation;
