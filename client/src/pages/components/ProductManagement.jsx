import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

// Default placeholder image (base64)
const DEFAULT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTUwIDEyNUMxNjcuNjUgMTI1IDE4MiAxMTAuNjUgMTgyIDkzQzE4MiA3NS4zNSAxNjcuNjUgNjEgMTUwIDYxQzEzMi4zNSA2MSAxMTggNzUuMzUgMTE4IDkzQzExOCAxMTAuNjUgMTMyLjM1IDEyNSAxNTAgMTI1WiIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik0yMTIgMjM5QzIxMiAxOTguMjM0IDE3OS43NjYgMTY1IDE1MCAxNjVDMTIwLjIzNCAxNjUgODggMTk4LjIzNCA4OCAyMzlIMjEyWiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg==';

// Kategori produk yang tersedia
const PRODUCT_CATEGORIES = ['food', 'drink'];

// Ikon untuk ukuran tampilan
const ViewSizeIcons = {
  large: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  medium: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
    </svg>
  ),
  small: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h4m-4 6h8" />
    </svg>
  ),
};

const ProductManagement = ({ data, productActions, refreshData }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [viewSize, setViewSize] = useState('medium'); // 'large', 'medium', 'small'
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'food',
    stock: '',
    jenis_produk: 'non-kemasan',
    tanggal_expired: '',
    image: null,
    imagePreview: ''
  });

  useEffect(() => {
    if (editingProduct) {
      setNewProduct({
        name: editingProduct.name,
        price: editingProduct.price.toString(),
        category: editingProduct.category,
        stock: editingProduct.stock.toString(),
        jenis_produk: editingProduct.jenis_produk || 'non-kemasan',
        tanggal_expired: editingProduct.tanggal_expired ? editingProduct.tanggal_expired.substring(0,10) : '',
        image: null,
        imagePreview: editingProduct.image || DEFAULT_IMAGE
      });
    }
  }, [editingProduct]);
  
  // Filter produk saat data berubah atau ketika kategori berubah
  useEffect(() => {
    if (data) {
      let filtered = [...data];
      
      // Filter berdasarkan kategori
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(product => 
          product.category === selectedCategory
        );
      }
      
      // Reset pencarian saat kategori berubah
      setSearchQuery('');
      setFilteredProducts(filtered);
    }
  }, [data, selectedCategory]);
  
  // Filter produk berdasarkan pencarian
  const filterProducts = (products, query) => {
    if (!query.trim()) {
      // Jika query kosong, tampilkan semua produk dalam kategori yang dipilih
      let filtered = [...products];
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(product => 
          product.category === selectedCategory
        );
      }
      setFilteredProducts(filtered);
      return;
    }
    
    // Filter berdasarkan nama produk dan kategori yang dipilih
    const lowercaseQuery = query.toLowerCase();
    let filtered = products.filter(product => {
      const matchesName = product.name.toLowerCase().includes(lowercaseQuery);
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesName && matchesCategory;
    });
    
    console.log('Filtered products:', filtered);
    setFilteredProducts(filtered);
  };
  
  // Handle perubahan pencarian
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    console.log('Pencarian berubah:', query);
    // Hanya filter jika ada pencarian
    if (query.trim() === '') {
      console.log('Reset ke semua produk');
      let filtered = [...data];
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(product => 
          product.category === selectedCategory
        );
      }
      setFilteredProducts(filtered);
    } else {
      filterProducts(data, query);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'image/jpeg') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hanya file JPG yang diperbolehkan',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ukuran file maksimal 5MB',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('price', newProduct.price);
      formData.append('category', newProduct.category);
      formData.append('stock', newProduct.stock);
    formData.append('jenis_produk', newProduct.jenis_produk);
    if (newProduct.jenis_produk === 'kemasan') {
      formData.append('tanggal_expired', newProduct.tanggal_expired || '');
    }
      if (newProduct.image) {
        formData.append('image', newProduct.image);
      }

      if (editingProduct) {
        await productActions.updateProduct(editingProduct.id, formData);
      } else {
        await productActions.createProduct(formData);
      }

      setShowAddModal(false);
      setEditingProduct(null);
      setNewProduct({
        name: '',
        price: '',
        category: 'food',
        stock: '',
        jenis_produk: 'non-kemasan',
        tanggal_expired: '',
        image: null,
        imagePreview: ''
      });
      refreshData();

      // Notifikasi berhasil default
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: `Produk berhasil ${editingProduct ? 'diperbarui' : 'ditambahkan'}`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });

      // Jika produk kemasan yang tanggal expired-nya sudah lewat, berikan peringatan stok di-set 0
      if (newProduct.jenis_produk === 'kemasan' && newProduct.tanggal_expired) {
        const today = new Date().toISOString().substring(0, 10);
        if (newProduct.tanggal_expired <= today) {
          Swal.fire({
            icon: 'warning',
            title: 'Produk Kedaluwarsa',
            text: 'Tanggal kedaluwarsa sudah lewat. Stok diatur menjadi 0 secara otomatis.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000
          });
        }
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menyimpan produk',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const handleDelete = async (productId) => {
    try {
      const result = await Swal.fire({
        title: 'Konfirmasi Hapus',
        text: 'Apakah Anda yakin ingin menghapus produk ini?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
      });

      if (result.isConfirmed) {
        await productActions.deleteProduct(productId);
        refreshData();
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Produk berhasil dihapus',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menghapus produk',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">Manajemen Produk</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-1 shadow-md transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* Baris filter kategori, pencarian, dan opsi tampilan */}
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
                {category === 'food' ? 'Makanan' : 'Minuman'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Opsi ukuran tampilan produk */}
        <div className="flex items-center space-x-1 bg-background-card rounded-lg p-1 shadow-sm border border-primary/10">
          <button 
            onClick={() => setViewSize('large')} 
            className={`p-2 rounded-md transition-all ${viewSize === 'large' ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'}`}
            title="Tampilan ikon besar"
          >
            {ViewSizeIcons.large}
          </button>
          <button 
            onClick={() => setViewSize('medium')} 
            className={`p-2 rounded-md transition-all ${viewSize === 'medium' ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'}`}
            title="Tampilan ikon sedang"
          >
            {ViewSizeIcons.medium}
          </button>
          <button 
            onClick={() => setViewSize('small')} 
            className={`p-2 rounded-md transition-all ${viewSize === 'small' ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'}`}
            title="Tampilan ikon kecil"
          >
            {ViewSizeIcons.small}
          </button>
        </div>
      </div>

      {/* Daftar Produk */}
      <div className={`grid gap-4 md:gap-6 transition-all
        ${viewSize === 'large' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 
          viewSize === 'medium' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
          'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'}`}>
        {filteredProducts.length === 0 ? (
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
              <div className={`relative overflow-hidden ${viewSize === 'small' ? 'h-28' : viewSize === 'medium' ? 'h-40' : 'h-48'}`}>
                <img
                  src={product.image || DEFAULT_IMAGE}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_IMAGE;
                  }}
                />
              </div>
              <div className="p-3">
                <h3 className={`font-semibold ${viewSize === 'small' ? 'text-sm' : 'text-base'} mb-1 text-text`}>
                  {product.name}
                </h3>
                <p className="font-medium text-primary">
                  Rp. {product.price.toLocaleString()}
                </p>
                <div className="text-sm text-text/80 flex flex-col">
                  <span>Kategori: {product.category === 'food' ? 'Makanan' : 'Minuman'}</span>
                  <span>Stok: {product.stock}</span>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setShowAddModal(true);
                    }}
                    className="text-white bg-secondary hover:bg-secondary-dark w-full md:w-auto md:px-4 px-2 py-1 text-xs sm:text-sm rounded-md transition-colors duration-200 shadow-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-white bg-accent hover:bg-accent-dark w-full md:w-auto md:px-4 px-2 py-1 text-xs sm:text-sm rounded-md transition-colors duration-200 shadow-sm"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Tambah/Edit Produk */}
      {showAddModal && (
        <div className="fixed inset-0 bg-primary bg-opacity-20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background-card rounded-lg shadow-xl p-6 max-w-md w-full border border-primary/10"
          >
            <h3 className="text-xl font-bold mb-4 text-primary">
              {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-primary">
                  Nama Produk
                </label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-primary/30 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-primary">
                  Harga (Rp)
                </label>
                <input
                  type="number"
                  name="price"
                  value={newProduct.price}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-primary/30 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition duration-200"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Jenis Produk
                </label>
                <select
                  name="jenis_produk"
                  value={newProduct.jenis_produk}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                  required
                >
                  <option value="non-kemasan">Non-kemasan</option>
                  <option value="kemasan">Kemasan</option>
                </select>
              </div>

              {newProduct.jenis_produk === 'kemasan' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tanggal Expired
                  </label>
                  <input
                    type="date"
                    name="tanggal_expired"
                    value={newProduct.tanggal_expired}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kategori
                </label>
                <select
                  name="category"
                  value={newProduct.category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                  required
                >
                  {PRODUCT_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category === 'food' ? 'Makanan' : 'Minuman'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stok
                </label>
                <input
                  type="number"
                  name="stock"
                  value={newProduct.stock}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gambar Produk (JPG, max 5MB)
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <div className="relative w-24 h-24">
                    <img
                      src={newProduct.imagePreview || DEFAULT_IMAGE}
                      alt="Preview"
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_IMAGE;
                      }}
                    />
                  </div>
                  <input
                    type="file"
                    accept=".jpg,image/jpeg"
                    onChange={handleImageChange}
                    className="text-sm text-gray-900"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                    setNewProduct({
                      name: '',
                      price: '',
                      category: 'food',
                      stock: '',
                      jenis_produk: 'non-kemasan',
                      tanggal_expired: '',
                      image: null,
                      imagePreview: ''
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-primary rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-1 shadow-md transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>{editingProduct ? 'Simpan' : 'Tambah'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
