import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { logoPerusahaan } from '../assets/index';

const Sidebar = ({ isSidebarOpen, toggleSidebar, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Menu Button - Lebih mudah diakses pada perangkat mobile */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/90 shadow-lg md:hidden"
        aria-label="Toggle Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isSidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Responsif untuk layar kecil */}
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : -320,
          opacity: 1
        }}
        transition={{ duration: 0.2 }}
        className={`fixed md:static top-0 left-0 h-full z-40 bg-white/90 backdrop-blur-sm shadow-2xl border-r border-gray-200/50 w-[280px] md:w-64 lg:w-20 md:translate-x-0 overflow-y-auto`}
      >
        <div className="p-4">
          <div className={`flex items-center ${!isSidebarOpen && 'lg:justify-center'}`}>
            <img src={logoPerusahaan} alt="Logo Retro Kopi" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            {(isSidebarOpen || !isSidebarOpen && window.innerWidth < 1024) && (
              <span className="ml-2 text-base sm:text-xl font-bold text-gray-900">Admin</span>
            )}
          </div>
        </div>

        <nav className="mt-4 sm:mt-8">
          <div className="px-2 sm:px-4 space-y-1 sm:space-y-2">
            <Link
              to="/dashboard"
              className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-900 hover:bg-gray-100/80'
              }`}
              onClick={() => setActiveTab('users')}
            >
              <div className="flex items-center space-x-2 sm:space-x-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {isSidebarOpen && <span className="text-sm sm:text-base whitespace-nowrap">Manajemen Pengguna</span>}
              </div>
            </Link>

            <Link
              to="/dashboard/products"
              className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                activeTab === 'products'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-900 hover:bg-gray-100/80'
              }`}
              onClick={() => setActiveTab('products')}
            >
              <div className="flex items-center space-x-2 sm:space-x-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
                {isSidebarOpen && <span className="text-sm sm:text-base whitespace-nowrap">Manajemen Produk</span>}
              </div>
            </Link>

            <Link
              to="/dashboard/orders"
              className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-900 hover:bg-gray-100/80'
              }`}
              onClick={() => setActiveTab('orders')}
            >
              <div className="flex items-center space-x-2 sm:space-x-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {isSidebarOpen && <span className="text-sm sm:text-base whitespace-nowrap">Konfirmasi Pesanan</span>}
              </div>
            </Link>

            <Link
              to="/dashboard/payments"
              className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                activeTab === 'payments'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-900 hover:bg-gray-100/80'
              }`}
              onClick={() => setActiveTab('payments')}
            >
              <div className="flex items-center space-x-2 sm:space-x-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 8v12a2 2 0 002 2h3a2 2 0 002-2V8a2 2 0 00-2-2h-3a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {isSidebarOpen && <span className="text-sm sm:text-base whitespace-nowrap">Pembayaran</span>}
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full p-2 sm:p-4 text-left text-red-600 hover:bg-red-50 mt-2 sm:mt-4 flex items-center space-x-2 sm:space-x-4 rounded-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {isSidebarOpen && <span className="text-sm sm:text-base whitespace-nowrap">Keluar</span>}
            </button>
          </div>
        </nav>
      </motion.aside>
    </>
  );
};

Sidebar.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired
};

export default Sidebar;