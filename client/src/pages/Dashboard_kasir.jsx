import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { productsAPI, ordersAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import PaymentConfirmation from './components/PaymentConfirmation';
import axios from 'axios';
import { logoPerusahaan } from '../assets/index';
import CartToggleButton from './components/CartToggleButton';
import CartPanel from './components/CartPanel';


// Konstanta kategori produk
const PRODUCT_CATEGORIES = ['makanan', 'minuman'];

const Dashboard_kasir = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [error, setError] = useState(null);
  const [viewSize, setViewSize] = useState('medium'); // 'large', 'medium', or 'small'

  const navigate = useNavigate();

  const paymentMethods = ['cash', 'transfer', 'qris'];
  
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
    showCloseButton: true,
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

  // Fetch products when component mounts or category changes and reset search
  useEffect(() => {
    // Reset pencarian saat kategori berubah
    setSearchQuery('');
    fetchProducts(true); // Parameter true menandakan ini adalah perubahan kategori
  }, [selectedCategory]);

  const fetchProducts = async (isCategoryChange = false) => {
    try {
      setLoading(true);
      let response;
      if (selectedCategory === 'all') {
        response = await productsAPI.getAllProducts();
      } else {
        // Pastikan kategori yang dikirim ke API menggunakan huruf kecil
        response = await productsAPI.getProductsByCategory(selectedCategory.toLowerCase());
      }
      
      console.log('Products fetched:', response.data); // Debugging
      const productsData = response.data;
      setProducts(productsData);
      
      // Jika ini adalah perubahan kategori, tampilkan semua produk tanpa filter
      // Jika tidak, tetapkan filter jika ada pencarian aktif
      if (isCategoryChange || searchQuery.trim() === '') {
        console.log('Menampilkan semua produk dalam kategori', selectedCategory);
        setFilteredProducts(productsData);
      } else {
        console.log('Menerapkan filter pencarian:', searchQuery);
        filterProducts(productsData, searchQuery);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal mengambil data produk',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fungsi untuk memfilter produk berdasarkan pencarian
  const filterProducts = (productsData, query) => {
    if (!query || query === '') {
      setFilteredProducts(productsData);
      return;
    }
    
    const filtered = productsData.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredProducts(filtered);
    console.log(`Hasil pencarian: ${filtered.length} produk ditemukan dari ${productsData.length} total`); // Debug log
  };
  
  // Handle perubahan pencarian
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    console.log('Pencarian berubah:', query);
    // Hanya filter jika ada pencarian
    if (query.trim() === '') {
      console.log('Reset ke semua produk');
      setFilteredProducts(products);
    } else {
      filterProducts(products, query);
    }
  };

  // Fetch orders
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAllOrders();
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPayments = async () => {
    try {
      setLoading(true);
      console.log('Fetching payments...');
      const response = await axiosInstance.get('/api/orders/payments');
      console.log('Payments data received:', response.data); // Debug log
      
      if (Array.isArray(response.data)) {
        console.log(`Received ${response.data.length} payments`); 
        
        // Tambahkan log untuk debugging payment_status
        response.data.forEach(payment => {
          console.log(`Payment #${payment.id}, status: ${payment.status}, payment_status: ${payment.payment_status}`);
        });
        
        // Pastikan data diurutkan dengan yang terbaru di atas
        const sortedData = [...response.data].sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setPayments(sortedData);
      } else {
        console.error('Invalid payments data format:', response.data);
        setPayments([]);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      handleError(error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
        
        // Tampilkan notifikasi untuk item yang jumlahnya bertambah
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: ` ${product.name} berhasil ditambahkan keranjang`,
          toast: true,
    showCloseButton: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Stock tidak mencukupi',
          text: 'Jumlah pesanan melebihi stock yang tersedia',
          showConfirmButton: false,
          timer: 1500
        });
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
      
      // Tampilkan notifikasi untuk item baru yang ditambahkan
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: `${product.name} ditambahkan ke keranjang`,
        toast: true,
    showCloseButton: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    if (newQuantity <= product.stock) {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Stock tidak mencukupi',
        text: 'Jumlah pesanan melebihi stock yang tersedia',
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = async () => {
    if (!customerName || !tableNumber) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Silakan isi nama pelanggan dan nomor meja',
        showConfirmButton: false,
        timer: 1500
      });
      return;
    }

    if (!cart.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Keranjang belanja masih kosong',
        showConfirmButton: false,
        timer: 1500
      });
      return;
    }

    try {
      // Tampilkan ringkasan pesanan sebelum membuat pesanan
      const confirmResult = await Swal.fire({
        title: 'Ringkasan Pesanan',
        html: `
          <div class="text-left">
            <p><strong>Nama Pelanggan:</strong> ${customerName}</p>
            <p><strong>Nomor Meja:</strong> ${tableNumber}</p>
            <p><strong>Total:</strong> Rp ${calculateTotal().toLocaleString()}</p>
            <p><strong>Item:</strong></p>
            <ul class="mt-2">
              ${cart.map(item => `<li>${item.name} (${item.quantity}x) - Rp ${(item.price * item.quantity).toLocaleString()}</li>`).join('')}
            </ul>
          </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Lanjutkan ke Pembayaran',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#3085d6'
      });

      if (!confirmResult.isConfirmed) {
        return;
      }

      const orderData = {
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: calculateTotal(),
        customer_name: customerName,
        table_number: tableNumber,
        payment_method: 'cash',
        payment_status: 'unpaid', // Set status pembayaran sebagai belum dibayar
        status: 'completed' // Status pesanan completed tapi belum dibayar
      };

      const response = await ordersAPI.createOrder(orderData);
      
      if (response.data.order) {
        // Set current order
        setCurrentOrder(response.data.order);

        // Clear cart and form
        setCart([]);
        setCustomerName('');
        setTableNumber('');
          
        // Refresh products to update stock
        fetchProducts();
        
        // Tunggu sedikit untuk memastikan data tersimpan di database
        setTimeout(async () => {
          console.log('Timeout completed, fetching payments...');
          // Refresh payments dan pindah ke tab payments
          await fetchPayments();
          console.log('Setting active tab to payments...');
          setActiveTab('payments');
          
          // Double check dengan fetch kedua setelah beberapa detik
          setTimeout(() => {
            console.log('Performing second fetch to ensure data is updated...');
            fetchPayments();
          }, 1000);
          
          // Tambahkan log untuk debugging di browser console
          console.log('%c>>> PESANAN BERHASIL DIBUAT. SILAKAN KONFIRMASI PEMBAYARAN <<<', 'background: #6F4E37; color: white; padding: 4px; border-radius: 4px;');
        }, 800);

        Swal.fire({
          icon: 'success',
          title: 'Sukses',
          text: 'Pesanan berhasil dibuat. Silakan konfirmasi pembayaran.',
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      console.error('Create order error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Gagal membuat pesanan. Silakan coba lagi.',
        showConfirmButton: true
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  // API untuk mengelola orders
  const orderActions = {
    updateStatus: async (orderId, status) => {
      try {
        console.log(`Updating order #${orderId} status to: ${status}`);
        const response = await axiosInstance.patch(`/api/orders/${orderId}/status`, { status });
        fetchOrders();
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Status pesanan berhasil diperbarui',
          toast: true,
    showCloseButton: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        return response.data;
      } catch (error) {
        throw new Error(handleError(error));
      }
    },

    updatePayment: async (orderId, paymentStatus) => {
      try {
        console.log(`Updating order #${orderId} payment_status to: ${paymentStatus}`);
        const response = await axiosInstance.patch(`/api/orders/${orderId}/payment`, { payment_status: paymentStatus });
        console.log('Update payment response:', response.data);
        
        // Tunggu sedikit sebelum refresh untuk memastikan database sudah diupdate
        setTimeout(() => {
          fetchPayments();
        }, 500);
        
        return response.data;
      } catch (error) {
        console.error('Error updating payment status:', error);
        throw new Error(handleError(error));
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <div className="flex flex-col gap-4">
            {/* Filter kategori, pencarian, dan ukuran tampilan */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
              <div className="flex flex-col w-full md:w-auto gap-4 mb-2 md:mb-0">
                {/* Pencarian produk */}
                <div className="relative w-full">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <svg className="w-4 h-4 text-primary" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                    </svg>
                  </div>
                  <input 
                    type="search" 
                    className="block w-full p-2.5 ps-10 text-sm text-text bg-background-card border border-primary/20 rounded-lg focus:ring-primary focus:border-primary" 
                    placeholder="Cari produk..." 
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                
                {/* Filter kategori */}
                <div className="flex flex-wrap space-x-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-background-card text-primary hover:bg-primary/10'
                  }`}
                >
                  Semua
                </button>
                {PRODUCT_CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg capitalize transition-all duration-200 ${
                      selectedCategory === category
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-background-card text-primary hover:bg-primary/10'
                    }`}
                  >
                    {category === 'makanan' ? 'Makanan' : 'Minuman'}
                  </button>
                ))}
              </div>
              
              {/* Opsi ukuran tampilan produk */}
              <div className="flex items-center space-x-1 bg-background-card rounded-lg p-1 shadow-sm border border-primary/10">
                <button 
                  onClick={() => setViewSize('large')} 
                  className={`p-2 rounded-md transition-all ${viewSize === 'large' ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'}`}
                  title="Tampilan ikon besar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => setViewSize('medium')} 
                  className={`p-2 rounded-md transition-all ${viewSize === 'medium' ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'}`}
                  title="Tampilan ikon sedang"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.5 3a.5.5 0 0 1 0-1h9a.5.5 0 0 1 0 1h-9zm0 4a.5.5 0 0 1 0-1h9a.5.5 0 0 1 0 1h-9zm0 4a.5.5 0 0 1 0-1h5a.5.5 0 0 1 0 1h-5z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => setViewSize('small')} 
                  className={`p-2 rounded-md transition-all ${viewSize === 'small' ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'}`}
                  title="Tampilan ikon kecil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h12A1.5 1.5 0 0 1 16 2.5v3A1.5 1.5 0 0 1 14.5 7h-12A1.5 1.5 0 0 1 1 5.5v-3zm0 8A1.5 1.5 0 0 1 2.5 9h12a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 1 13.5v-3z"/>
                  </svg>
                </button>
                </div>
              </div>
            </div>
            
            {/* Products grid - responsive based on view size */}
            <div className={`grid gap-4 md:gap-6 transition-all
              ${viewSize === 'large' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 
                viewSize === 'medium' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'}`}>
              {loading ? (
                <p className="text-text">Memuat produk...</p>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-text">{searchQuery ? 'Tidak ada produk yang sesuai dengan pencarian' : 'Tidak ada produk yang tersedia'}</p>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-background-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all border border-primary/10"
                  >
                    <img
                      src={product.image || 'https://via.placeholder.com/300?text=No+Image'}
                      alt={product.name}
                      className={`w-full object-cover ${
                        viewSize === 'large' ? 'h-64' : 
                        viewSize === 'medium' ? 'h-48' : 
                        'h-32'
                      }`}
                      onError={(e) => {
                        console.log('Image load error:', e.target.src); // Debug log
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                      }}
                    />
                    <div className={`${
                        viewSize === 'small' ? 'p-2 text-sm' : 'p-4'
                      }`}>
                      <h3 className={`font-semibold text-primary ${
                        viewSize === 'large' ? 'text-xl' : 
                        viewSize === 'medium' ? 'text-lg' : 
                        'text-base'
                      }`}>{product.name}</h3>
                      <p className="text-text font-bold">Rp {product.price.toLocaleString()}</p>
                      <div className="mt-1">
                        <span className="text-sm text-primary">Stock: {product.stock}</span>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className={`w-full mt-3 rounded-lg transition-all duration-200 ${
                          product.stock === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark text-white shadow-sm'
                        } ${
                          viewSize === 'small' ? 'px-2 py-1 text-xs' : 'px-4 py-2'
                        }`}
                      >
                        {product.stock === 0 ? 'Stok Habis' : viewSize === 'small' ? '+ Keranjang' : 'Tambah ke Keranjang'}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );

      /* case 'cart':  => UI diganti ke panel, tetap gunakan fungsi logika cart */
      case 'cart-deprecated':
        return (
          <div className="space-y-6">
            <div className="dashboard-card">
              <h2 className="text-xl font-bold text-primary mb-4">Keranjang Belanja</h2>
              {cart.length === 0 ? (
                <p className="text-text">Keranjang kosong</p>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.id} className="flex flex-wrap items-center gap-4 py-4 border-b border-primary/10">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg border border-primary/10 shadow-sm"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary">{item.name}</h3>
                        <p className="text-text">Rp {item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center space-x-4 w-full sm:w-auto">
                        {/* Quantity controls with always-visible icons */}
                        <div className="flex items-center border border-primary/30 rounded-lg overflow-hidden">
                          {/* Minus button */}
                          <button
                            className="px-2 py-1 text-primary hover:bg-primary/10 disabled:opacity-40"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M3.5 8a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5z" />
                            </svg>
                          </button>

                          {/* Quantity input */}
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) updateQuantity(item.id, val);
                            }}
                            className="w-14 text-center appearance-none bg-background text-text focus:outline-none"
                          />

                          {/* Plus button */}
                          <button
                            className="px-2 py-1 text-primary hover:bg-primary/10 disabled:opacity-40"
                            onClick={() => updateQuantity(item.id, Math.min(item.quantity + 1, item.stock))}
                            disabled={item.quantity >= item.stock}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M8 3.5a.5.5 0 0 1 .5.5v4h4a.5.5 0 0 1 0 1h-4v4a.5.5 0 0 1-1 0v-4h-4a.5.5 0 0 1 0-1h4v-4a.5.5 0 0 1 .5-.5z" />
                            </svg>
                          </button>
                        </div>

                        {/* Remove from cart */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-accent hover:text-accent-dark transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6">
                    <h3 className="font-semibold text-primary mb-4">Informasi Pelanggan</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-primary">
                          Nama Pelanggan
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 bg-background text-text border border-primary/30 rounded-md hover:border-primary/50 focus:ring-2 focus:ring-primary/30 focus:border-primary transition duration-200"
                          placeholder="Masukkan nama pelanggan"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-primary">
                          Nomor Meja
                        </label>
                        <input
                          type="text"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 bg-background text-text border border-primary/30 rounded-md hover:border-primary/50 focus:ring-2 focus:ring-primary/30 focus:border-primary transition duration-200"
                          placeholder="Masukkan nomor meja"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-6">
                    <div className="border-t border-b border-primary/20 py-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-primary">Total</h3>
                        <p className="text-lg font-bold text-primary">Rp {calculateTotal().toLocaleString()}</p>
                      </div>
                    </div>
                    <div className='flex justify-end'>
                      <button
                        onClick={handleCreateOrder}
                        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-200 shadow-sm font-semibold"
                      >
                        Buat Pesanan
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'cart':
        return (
          <CartPanel 
            cart={cart} 
            updateQuantity={updateQuantity} 
            removeFromCart={removeFromCart} 
            customerName={customerName} 
            setCustomerName={setCustomerName} 
            tableNumber={tableNumber} 
            setTableNumber={setTableNumber} 
            cashGiven={cashGiven} 
            setCashGiven={setCashGiven} 
            calculateTotal={calculateTotal} 
            handleCreateOrder={handleCreateOrder} 
          />
        );

      case 'orders':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary">Daftar Pesanan</h2>

            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-text">
                  Tidak ada pesanan
                </div>
              ) : (
                orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm ${order.status === 'completed' ? 'bg-green-100 text-green-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {order.status === 'completed' ? 'Selesai' : order.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Customer</p>
                        <p className="text-gray-900">{order.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Nomor Meja</p>
                        <p className="text-gray-900">{order.table_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Pembayaran</p>
                        <p className="text-gray-900 font-semibold">
                          Rp {order.total_amount?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Metode Pembayaran</p>
                        <p className="text-gray-900 capitalize">{order.payment_method}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Items</p>
                      <p className="text-gray-900">{order.items_summary}</p>
                    </div>

                    {order.status === 'pending' && (
                      <div className="mt-6 flex justify-end space-x-4">
                        <button
                          onClick={async () => {
                            try {
                              const result = await Swal.fire({
                                title: 'Tolak Pesanan',
                                text: 'Apakah Anda yakin ingin menolak pesanan ini?',
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Ya, Tolak',
                                cancelButtonText: 'Batal',
                                confirmButtonColor: '#DC2626'
                              });

                              if (result.isConfirmed) {
                                await orderActions.updateStatus(order.id, 'rejected');
                                fetchOrders();
                              }
                            } catch (error) {
                              console.error('Error rejecting order:', error);
                              Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Gagal menolak pesanan',
                                toast: true,
    showCloseButton: true,
                                position: 'top-end',
                                showConfirmButton: false,
                                timer: 3000
                              });
                            }
                          }}
                          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-all duration-200 shadow-sm"
                        >
                          Tolak Pesanan
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const result = await Swal.fire({
                                title: 'Konfirmasi Pesanan',
                                text: 'Apakah Anda yakin ingin mengkonfirmasi pesanan ini?',
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonText: 'Ya, Konfirmasi',
                                cancelButtonText: 'Batal',
                                confirmButtonColor: '#6F4E37' // warna primary (coklat kopi)
                              });

                              if (result.isConfirmed) {
                                await orderActions.updateStatus(order.id, 'completed');
                                fetchOrders();
                              }
                            } catch (error) {
                              console.error('Error confirming order:', error);
                              Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Gagal mengkonfirmasi pesanan',
                                toast: true,
    showCloseButton: true,
                                position: 'top-end',
                                showConfirmButton: false,
                                timer: 3000
                              });
                            }
                          }}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-200 shadow-sm"
                        >
                          Konfirmasi Pesanan
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
        
      case 'payments':
        return (
          <PaymentConfirmation 
            data={payments} 
            orderActions={orderActions} 
            refreshData={fetchPayments} 
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-primary flex flex-col md:flex-row relative">
      {/* Komponen Toaster telah dihapus */}
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
            className={`transition-all duration-300 object-contain ${isSidebarOpen ? 'w-32 sm:w-40' : 'w-10 md:w-12 lg:w-14'}`}
          />
        </div>

        <div className="p-3 sm:p-4 border-b border-primary/20">
          <h1 className="font-bold transition-all duration-300 text-primary text-base sm:text-xl text-center">
            Kasir Dashboard
          </h1>
        </div>

        <nav className="mt-4 sm:mt-8">
          <div className="px-3 sm:px-4 space-y-1 sm:space-y-2">
            <button
              className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                activeTab === 'products'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-primary hover:bg-primary/10'
              }`}
              onClick={() => setActiveTab('products')}
            >
              <div className="flex items-center space-x-2 sm:space-x-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m-5-5v-4m-2 4H7a2 2 0 01-2-2V3a2 2 0 012-2h3v1h4v1h3v1h4v1M9 16h.01" />
                </svg>
                {isSidebarOpen && <span className="text-sm sm:text-base">Produk</span>}
              </div>
            </button>

            <button
              className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                activeTab === 'payments'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-primary hover:bg-primary/10'
              }`}
              onClick={() => {
                setActiveTab('payments');
                fetchPayments();
              }}
            >
              <div className="flex items-center space-x-2 sm:space-x-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {isSidebarOpen && <span className="text-sm sm:text-base">Status Pembayaran</span>}
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="w-full p-2 sm:p-4 text-left text-accent hover:bg-accent/10 mt-2 sm:mt-4 rounded-lg transition-all duration-300"
            >
              <div className="flex items-center space-x-2 sm:space-x-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {isSidebarOpen && <span className="text-sm sm:text-base">Keluar</span>}
              </div>
            </button>
          </div>
        </nav>
      </motion.aside>

      {/* Cart toggle button */}
      <CartToggleButton cartCount={cart.length} onClick={() => setIsCartOpen(true)} />

      {/* Cart panel */}
      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        customerName={customerName}
        setCustomerName={setCustomerName}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        calculateTotal={calculateTotal}
        handleCreateOrder={handleCreateOrder}
      />

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
      {/* Konfirmasi pesanan sekarang langsung terintegrasi dalam proses pembuatan pesanan */}
    </div>
  );
};



export default Dashboard_kasir;