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
  const [showPassword, setShowPassword] = useState(false);

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

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full pr-10 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white border border-primary/30 
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                           transition duration-200 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
                  placeholder="masukkan password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-primary focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    // eye-off icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.35.265-2.637.743-3.813M9.879 9.879a3 3 0 104.242 4.242M15 12a3 3 0 01-3 3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    </svg>
                  ) : (
                    // eye icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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