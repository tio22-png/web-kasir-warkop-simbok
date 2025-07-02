import { motion } from "framer-motion";
import Swal from 'sweetalert2';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoPerusahaan } from '../assets/index';
import { authAPI } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      Swal.fire({
        title: 'Error!',
        text: 'Username dan password harus diisi!',
        icon: 'error',
        showConfirmButton: false,
        timer: 1500,
        background: '#fff',
        customClass: {
          popup: 'rounded-xl border border-gray-200',
          title: 'text-red-500'
        }
      });
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.login(formData);
      const { token, user } = response.data;

      // Save token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      Swal.fire({
        icon: 'success',
        title: 'Login Berhasil!',
        text: 'Selamat datang kembali!',
        showConfirmButton: false,
        timer: 1500,
        background: '#fff',
        customClass: {
          popup: 'rounded-xl border border-gray-200'
        }
      });

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else if (user.role === 'kasir') {
        navigate('/dashboard-kasir');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal!',
        text: error.response?.data?.message || 'Terjadi kesalahan saat login',
        showConfirmButton: false,
        timer: 1500,
        background: '#fff',
        customClass: {
          popup: 'rounded-xl border border-gray-200'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-primary px-4 py-8">
      {/* Logo dipindahkan dari sini */}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-background-card w-full max-w-md mx-auto rounded-2xl shadow-xl overflow-hidden border border-primary/10"
      >
        <div className="p-4 sm:p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="flex flex-col items-center gap-2 mb-4">
              {/* Logo - Dipindahkan ke sini */}
              <img 
                src={logoPerusahaan} 
                alt="Retro Kopi" 
                className="w-48 sm:w-56 md:w-64 h-auto object-contain"
              />
              <p className="mt-2 text-sm sm:text-base text-text-light">Silakan masuk ke akun Anda</p>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mt-6 sm:mt-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <label className="block text-sm font-medium text-primary">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white border border-primary/30 
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                         transition duration-200 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
                placeholder="masukkan username"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label className="block text-sm font-medium text-primary">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white border border-primary/30 
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                         transition duration-200 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
                placeholder="masukkan password"
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              type="submit"
              disabled={loading}
              className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-primary text-white 
                        rounded-lg font-semibold shadow-md hover:bg-primary-dark 
                        focus:outline-none focus:ring-2 focus:ring-primary/50 transition duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;