import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

const UserManagement = ({ data, userActions, refreshData }) => {
  // Fungsi untuk memeriksa apakah tampilan mobile
  const isMobile = window.innerWidth < 768;
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'kasir'
  });

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!formData.username || !formData.password || !formData.role || !formData.email) {
        Swal.fire({
          icon: 'error',
          title: 'Validasi Error',
          text: 'Mohon isi semua field yang diperlukan',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        return;
      }

      if (editingUser) {
        await userActions.ubah(editingUser.id, formData);
      } else {
        await userActions.tambah(formData);
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'kasir'
      });
      refreshData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Password tidak diisi saat edit
      role: user.role
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Konfirmasi Hapus',
        text: 'Apakah Anda yakin ingin menghapus pengguna ini?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
      });

      if (result.isConfirmed) {
        await userActions.hapus(id);
        refreshData();
        Swal.fire('Terhapus!', 'Pengguna berhasil dihapus.', 'success');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'kasir'
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-xl font-bold text-primary mb-2 sm:mb-0">Manajemen Pengguna</h2>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              username: '',
              email: '',
              password: '',
              role: 'kasir'
            });
            setShowModal(true);
          }}
          className="px-3 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-all duration-200 text-sm sm:text-base shadow-sm"
        >
          Tambah Pengguna
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">  {/* Negative margin to expand scroll area */}
        <div className="inline-block min-w-full align-middle px-2 sm:px-0"> {/* Reduced padding for mobile */}
          <table className="w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                  Username
                </th>
                <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%]">
                  Email
                </th>
                <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                  Role
                </th>
                <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[35%]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium truncate">
                    {user.username}
                  </td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 truncate">
                    {user.email}
                  </td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {user.role}
                  </td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-medium">
                    <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-white bg-secondary hover:bg-secondary-dark w-full md:w-auto md:px-4 px-2 py-1 text-xs sm:text-sm rounded-md transition-colors duration-200 shadow-sm"
                        aria-label="Edit User"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-white bg-accent hover:bg-accent-dark w-full md:w-auto md:px-4 px-2 py-1 text-xs sm:text-sm rounded-md transition-colors duration-200 shadow-sm"
                        aria-label="Delete User"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit Pengguna */}
      {showModal && (
        <div className="fixed inset-0 bg-primary bg-opacity-20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background-card rounded-lg shadow-lg p-6 max-w-md w-full border border-primary/10"
          >
            <h3 className="text-xl font-bold mb-4 text-primary">
              {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="mb-4">
                  <label className="block text-primary text-sm font-bold mb-2" htmlFor="username">
                    Nama Pengguna
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="appearance-none border border-primary/30 rounded w-full py-2 px-3 bg-background text-text leading-tight focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition duration-200"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-primary text-sm font-bold mb-2" htmlFor="email">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="appearance-none border border-primary/30 rounded w-full py-2 px-3 bg-background text-text leading-tight focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition duration-200"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-primary text-sm font-bold mb-2" htmlFor="password">
                    {editingUser ? 'Kata Sandi Baru (kosongkan jika tidak diubah)' : 'Kata Sandi'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="appearance-none border border-primary/30 rounded w-full py-2 pr-10 px-3 bg-background text-text leading-tight focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition duration-200"
                      required={!editingUser}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-primary focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.35.265-2.637.743-3.813M9.879 9.879a3 3 0 104.242 4.242M15 12a3 3 0 01-3 3" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                    Peran
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="appearance-none border border-primary/30 rounded w-full py-2 px-3 bg-background text-text leading-tight focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition duration-200"
                  >
                    <option value="kasir">Kasir</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-primary rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-200 shadow-sm"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
