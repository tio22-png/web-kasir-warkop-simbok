import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { format, subDays, parseISO, isToday, startOfDay, endOfDay, isWithinInterval, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import axios from 'axios';
import api from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Registrasi Chart.js komponen
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SalesReport = () => {
  // State untuk menyimpan rentang waktu yang dipilih
  const [timeRange, setTimeRange] = useState('today');
  const [startDate, setStartDate] = useState(subDays(new Date(), 0)); // Hari ini sebagai default
  const [endDate, setEndDate] = useState(new Date());
  const [salesData, setSalesData] = useState([]);
  const [totalSummary, setTotalSummary] = useState({ totalOrders: 0, totalRevenue: 0 });
  const [chartType, setChartType] = useState('line'); // 'line' atau 'bar'
  const [productsSummary, setProductsSummary] = useState([]); // list produk terjual
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  // Helper untuk format tanggal 
  const formatDateDisplay = (date) => {
    if (!date) return '';
    try {
      return format(date, 'dd MMMM yyyy', { locale: id });
    } catch (error) {
      return date.toString();
    }
  };

  // Fungsi untuk mengambil data laporan penjualan dari API
  const fetchSalesData = async (startDate, endDate) => {
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      console.log(`[SalesReport] Mengambil data dari ${formattedStartDate} hingga ${formattedEndDate}`);
      
      try {
        console.log(`[SalesReport] Menggunakan API service untuk mengambil data`);  
        // Gunakan API service yang sudah dikonfigurasi dengan benar dan prefix /api
        const response = await axios.get(`/api/orders/sales-report?startDate=${formattedStartDate}&endDate=${formattedEndDate}`, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
        console.log(`[SalesReport] API URL yang benar: /api/orders/sales-report`);
        
        console.log('[SalesReport] Response data:', response.data);
        return response.data;
      } catch (error) {
        console.error('[SalesReport] Error fetching sales data:', error);
        throw error;
      }
    } catch (error) {
      console.error('[SalesReport] Outer error handler:', error);
      return {
        dailySales: [],
        summary: {
          totalOrders: 0,
          totalRevenue: 0
        }
      };
    }
  };

  // Memperbarui data saat rentang waktu berubah
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      const today = new Date();
      let start, end;

      switch(timeRange) {
        case 'today':
          start = subDays(today, 0);
          end = today;
          break;
        case '7days':
          start = subDays(today, 6);
          end = today;
          break;
        case '30days':
          start = subDays(today, 29);
          end = today;
          break;
        case 'custom':
          start = startDate;
          end = endDate;
          break;
        default:
          start = subDays(today, 0);
          end = today;
      }

      try {
        // Validasi tanggal sebelum memanggil API
        if (timeRange === 'custom' && (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()))) {
          setLoading(false);
          return;
        }

        // Ambil data dari API
        const responseData = await fetchSalesData(start, end);
        
        // Jika tidak ada data penjualan harian, set array kosong
        if (!responseData.dailySales || responseData.dailySales.length === 0) {
          setSalesData([]);
        } else {
          // Format data untuk chart
          setSalesData(responseData.dailySales);
        }
        
        // Set total summary
        setTotalSummary(responseData.summary || { totalOrders: 0, totalRevenue: 0 });

        // Set products summary
        setProductsSummary(responseData.productsSummary || []);
        
      } catch (err) {
        console.error('Error fetching sales data:', err);
        setError('Gagal mengambil data penjualan');
        setSalesData([]);
        setTotalSummary({ totalOrders: 0, totalRevenue: 0 });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, startDate, endDate]);

  // Data untuk chart.js
  // Opsi untuk grafik
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: "'Poppins', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumSignificantDigits: 3 }).format(value);
          }
        }
      }
    }
  };

  const chartData = {
    labels: salesData.map(item => format(parseISO(item.date), 'dd/MM')),
    datasets: [
      {
        label: 'Penjualan (Rp)',
        data: salesData.map(item => item.revenue),
        borderColor: '#6F4E37', // primary color
        backgroundColor: 'rgba(111, 78, 55, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#6F4E37',
        pointRadius: 4,
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Fungsi untuk me-refresh data
  const handleRefresh = () => {
    // Re-trigger effect untuk mengambil data terbaru
    const tempTimeRange = timeRange;
    setTimeRange('refresh'); // Nilai sementara yang berbeda
    setTimeout(() => setTimeRange(tempTimeRange), 10); // Kembali ke nilai asli
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold text-primary">Laporan Penjualan</h2>
        <div className="flex flex-wrap w-full sm:w-auto gap-2">
          <button
            onClick={handleRefresh}
            className="px-3 sm:px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center text-sm sm:text-base flex-1 sm:flex-none justify-center sm:justify-start"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')}
            className="px-3 sm:px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors flex items-center text-sm sm:text-base flex-1 sm:flex-none justify-center sm:justify-start"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {chartType === 'line' ? 'Tampilan Bar' : 'Tampilan Line'}
          </button>
        </div>
      </div>

      {/* Filter Periode */}
      <div className="flex flex-wrap gap-2 w-full mb-4">
        <button
          onClick={() => setTimeRange('today')}
          className={`px-3 sm:px-4 py-2 rounded-lg flex-1 sm:flex-none text-sm sm:text-base transition-all duration-200 ${timeRange === 'today' ? 'bg-primary text-white shadow-sm' : 'bg-background-card text-primary hover:bg-primary/10'}`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setTimeRange('7days')}
          className={`px-3 sm:px-4 py-2 rounded-lg flex-1 sm:flex-none text-sm sm:text-base transition-all duration-200 ${timeRange === '7days' ? 'bg-primary text-white shadow-sm' : 'bg-background-card text-primary hover:bg-primary/10'}`}
        >
          7 Hari Terakhir
        </button>
        <button
          onClick={() => setTimeRange('30days')}
          className={`px-3 sm:px-4 py-2 rounded-lg flex-1 sm:flex-none text-sm sm:text-base transition-all duration-200 ${timeRange === '30days' ? 'bg-primary text-white shadow-sm' : 'bg-background-card text-primary hover:bg-primary/10'}`}
        >
          30 Hari Terakhir
        </button>
        <button
          onClick={() => setTimeRange('custom')}
          className={`px-3 sm:px-4 py-2 rounded-lg flex-1 sm:flex-none text-sm sm:text-base transition-all duration-200 ${timeRange === 'custom' ? 'bg-accent text-white shadow-sm' : 'bg-background-card text-accent hover:bg-accent/10'}`}
        >
          Kustom
        </button>
      </div>

      {/* Ringkasan Penjualan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-background-card rounded-lg shadow-sm p-4 border border-primary/10">
          <h3 className="text-sm text-text-light mb-1">Total Penjualan</h3>
          <p className="text-2xl font-bold text-primary">{totalSummary.totalOrders} Pesanan</p>
          <p className="text-xs text-text-light mt-1">
            {timeRange === 'today' ? 'Hari Ini' : 
             timeRange === '7days' ? '7 Hari Terakhir' : 
             timeRange === '30days' ? '30 Hari Terakhir' : 
             `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`}
          </p>
        </div>
        <div className="bg-background-card rounded-lg shadow-sm p-4 border border-primary/10">
          <h3 className="text-sm text-text-light mb-1">Total Pendapatan</h3>
          <p className="text-2xl font-bold text-primary">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalSummary.totalRevenue)}
          </p>
          <p className="text-xs text-text-light mt-1">
            {timeRange === 'today' ? 'Hari Ini' : 
             timeRange === '7days' ? '7 Hari Terakhir' : 
             timeRange === '30days' ? '30 Hari Terakhir' : 
             `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`}
          </p>
        </div>
      </div>

      {/* Filter Tanggal Kustom */}
      {timeRange === 'custom' && (
        <div className="bg-background-card p-6 rounded-lg shadow-md border border-primary/10 mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-primary mb-2">Filter Berdasarkan Tanggal</h3>
            <p className="text-text text-sm mb-4">Pilih rentang tanggal untuk melihat laporan penjualan:</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-text mb-1">Tanggal Mulai:</label>
              <input
                type="date"
                value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white text-gray-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm text-text mb-1">Tanggal Akhir:</label>
              <input
                type="date"
                value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                min={startDate ? format(startDate, 'yyyy-MM-dd') : undefined}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white text-gray-800 font-medium"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm sm:text-base"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
      
      {/* Produk Terjual */}
      <div className="bg-background-card rounded-lg shadow-sm p-4 border border-primary/10 mb-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Produk Terjual</h3>
        {productsSummary.length === 0 ? (
          <p className="text-text">Tidak ada produk terjual pada rentang waktu ini.</p>
        ) : (
          <div className="divide-y divide-primary/10">
            {productsSummary.map((prod, idx) => (
              <div key={prod.id} className="flex justify-between py-2 text-sm">
                <span className="text-text font-medium">{idx + 1}. {prod.name}</span>
                <span className="text-primary font-semibold">{prod.total_sold}x</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grafik Penjualan */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-primary mb-4">Grafik Penjualan</h3>
        <div className="h-80 w-full">
          {chartType === 'line' ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
