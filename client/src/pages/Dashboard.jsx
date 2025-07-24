import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import UserManagement from './components/UserManagement';
import ProductManagement from './components/ProductManagement';
import SalesReport from './components/SalesReport';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { logoPerusahaan } from '../assets/index';

// URL dasar API
const API_BASE_URL = import.meta.env.VITE_API_URL || '/';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    users: [], // data pengguna
    products: [], // data produk
    sales: [] // data penjualan (akan diisi oleh komponen SalesReport dengan data dummy)
  });
  const navigate = useNavigate();

  // Membuat instance axios dengan header otentikasi
  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Fungsi untuk menangani error
  const handleError = (error) => {
    console.error('Terjadi kesalahan:', error);
    const pesanError = error.response?.data?.message || 'Terjadi kesalahan pada sistem';
    
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: pesanError,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return pesanError;
  };

  // API untuk mengelola produk
  const productActions = {
    createProduct: async (formData) => {
      try {
        const response = await axiosInstance.post('/api/products', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        await ambilData();
        return response.data;
      } catch (error) {
        throw new Error(handleError(error));
      }// Create new order
      router.post('/', async (req, res) => {
          try {
              const { items, total_amount, payment_method, customer_name, table_number } = req.body;
      
              // Validasi input
              if (!items || !Array.isArray(items) || items.length === 0) {
                  return res.status(400).json({ message: 'Items tidak boleh kosong' });
              }
      
              if (!customer_name || !table_number) {
                  return res.status(400).json({ message: 'Nama pelanggan dan nomor meja harus diisi' });
              }
      
              // Validasi stok untuk semua items
              for (const item of items) {
                  const [products] = await db.promise().query(
                      'SELECT stock FROM products WHERE id = ?',
                      [item.id]
                  );
      
                  if (!products || products.length === 0) {
                      return res.status(404).json({ message: `Produk dengan ID ${item.id} tidak ditemukan` });
                  }
      
                  if (products[0].stock < item.quantity) {
                      return res.status(400).json({ message: `Stok tidak mencukupi untuk produk dengan ID ${item.id}` });
                  }
              }
      
              // Begin transaction
              const connection = await db.promise();
              await connection.beginTransaction();
      
              try {
                  // Create order
                  const [orderResult] = await connection.query(
                      'INSERT INTO orders (total_amount, payment_method, customer_name, table_number, status, payment_status) VALUES (?, ?, ?, ?, ?, ?)',
                      [total_amount, payment_method, customer_name, table_number, 'pending', 'pending']
                  );
      
                  const orderId = orderResult.insertId;
      
                  // Add order items and update stock
                  for (const item of items) {
                      await connection.query(
                          'INSERT INTO order_items (order_id, product_id, quantity, price_per_unit) VALUES (?, ?, ?, ?)',
                          [orderId, item.id, item.quantity, item.price]
                      );
      
                      await connection.query(
                          'UPDATE products SET stock = stock - ? WHERE id = ?',
                          [item.quantity, item.id]
                      );
                  }
      
                  // Commit transaction
                  await connection.commit();
      
                  // Get created order
                  const [order] = await connection.query(`
                      SELECT o.*, GROUP_CONCAT(CONCAT(p.name, ' x', oi.quantity) SEPARATOR ', ') as items_summary
                      FROM orders o
                      LEFT JOIN order_items oi ON o.id = oi.order_id
                      LEFT JOIN products p ON oi.product_id = p.id
                      WHERE o.id = ?
                      GROUP BY o.id
                  `, [orderId]);
      
                  res.status(201).json({
                      message: 'Order berhasil dibuat',
                      order: order[0]
                  });
              } catch (error) {
                  await connection.rollback();
                  throw error;
              }
          } catch (error) {
              console.error('Error creating order:', error);
              res.status(500).json({
                  message: error.message || 'Terjadi kesalahan saat membuat pesanan'
              });
          }
      });
    },

    updateProduct: async (productId, formData) => {
      try {
        const response = await axiosInstance.put(`/api/products/${productId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        await ambilData();
        return response.data;
      } catch (error) {
        throw new Error(handleError(error));
      }
    },

    deleteProduct: async (productId) => {
      try {
        const response = await axiosInstance.delete(`/api/products/${productId}`);
        await ambilData();
        return response.data;
      } catch (error) {
        throw new Error(handleError(error));
      }
    }
  };



  // API untuk mengelola users
  const userActions = {
    tambah: async (userData) => {
      try {
        const response = await axiosInstance.post('/api/users', userData);
        await ambilData();
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Pengguna berhasil ditambahkan',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        return response.data;
      } catch (error) {
        throw new Error(handleError(error));
      }
    },

    ubah: async (id, userData) => {
      try {
        const response = await axiosInstance.put(`/api/users/${id}`, userData);
        await ambilData();
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Pengguna berhasil diperbarui',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        return response.data;
      } catch (error) {
        throw new Error(handleError(error));
      }
    },

    hapus: async (id) => {
      try {
        const response = await axiosInstance.delete(`/api/users/${id}`);
        await ambilData();
        return response.data;
      } catch (error) {
        throw new Error(handleError(error));
      }
    }
  };

  // Mengambil data berdasarkan tab yang aktif
  const ambilData = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      switch (activeTab) {
        case 'users':
          response = await axiosInstance.get('/api/users');
          break;
        case 'products':
          response = await axiosInstance.get('/api/products');
          break;
        default:
          return;
      }

      setData(prev => ({
        ...prev,
        [activeTab]: response.data
      }));
    } catch (error) {
      const pesanError = handleError(error);
      setError(pesanError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ambilData();
  }, [activeTab]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500 text-center">
            <p className="text-xl font-semibold">Terjadi Kesalahan</p>
            <p>{error}</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      data: data[activeTab],
      productActions,
      userActions,
      refreshData: ambilData
    };

    switch (activeTab) {
      case 'users':
        return <UserManagement {...commonProps} />;
      case 'products':
        return <ProductManagement {...commonProps} />;
      case 'sales':
        return <SalesReport {...commonProps} />;
      default:
        return <UserManagement {...commonProps} />;
    }
  };

  const handleLogout = () => {
    // Hapus token dari localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    
    // Redirect ke halaman login
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-primary flex flex-col md:flex-row">
      {/* Mobile & Desktop Menu Button - Visible on both */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-background-card shadow-lg"
        aria-label="Toggle Menu"
      >
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isSidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for all screen sizes when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Fixed position for all screen sizes */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: isSidebarOpen ? 0 : -300, opacity: isSidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed left-0 top-0 h-full bg-background-card shadow-xl z-20 ${isSidebarOpen ? 'w-52' : 'w-0'} overflow-hidden transition-all duration-300`}
      >
        {/* Logo Perusahaan */}
        <div className="p-4 flex justify-center">
          <img 
            src={logoPerusahaan} 
            alt="Retro Kopi" 
            className={`transition-all duration-300 object-contain ${isSidebarOpen ? 'w-32 sm:w-40' : 'w-0 md:w-12 lg:w-14'}`}
          />
        </div>

        <div className="p-3 sm:p-4 border-b border-primary/20">
          <h1 className="font-bold transition-all duration-300 text-primary text-base sm:text-xl text-center">
            Admin Dashboard
          </h1>
        </div>

        <nav className="mt-4 sm:mt-8">
          <div className="px-3 sm:px-4 space-y-1 sm:space-y-2">
            <button
              className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                activeTab === 'users'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-primary hover:bg-primary/10'
              }`}
              onClick={() => setActiveTab('users')}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {isSidebarOpen && <span className="text-sm sm:text-base">Pengguna</span>}
              </div>
            </button>

            <button
              className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                activeTab === 'products'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-primary hover:bg-primary/10'
              }`}
              onClick={() => setActiveTab('products')}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {isSidebarOpen && <span className="text-sm sm:text-base">Produk</span>}
              </div>
            </button>

            <button
              className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                activeTab === 'sales'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-primary hover:bg-primary/10'
              }`}
              onClick={() => setActiveTab('sales')}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {isSidebarOpen && <span className="text-sm sm:text-base">Laporan Penjualan</span>}
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="w-full p-2 sm:p-4 text-left text-accent hover:bg-accent/10 mt-2 sm:mt-4 rounded-lg transition-all duration-300"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {isSidebarOpen && <span className="text-sm sm:text-base">Logout</span>}
              </div>
            </button>
          </div>
        </nav>
      </motion.aside>

      {/* Main Content - responsif untuk mobile dan desktop */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto transition-all duration-500 pt-16 bg-primary">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-7xl mx-auto"
        >
          <div className="dashboard-card bg-background-card rounded-xl shadow-md p-3 sm:p-4 md:p-6">
            <div className="text-text">
              {renderContent()}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
