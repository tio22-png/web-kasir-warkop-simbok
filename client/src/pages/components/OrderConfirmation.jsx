import React from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

const OrderConfirmation = ({ data, orderActions, refreshData }) => {
  const handleConfirm = async (orderId) => {
    try {
      const result = await Swal.fire({
        title: 'Konfirmasi Pesanan',
        text: 'Apakah Anda yakin ingin mengkonfirmasi pesanan ini?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Konfirmasi',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#10B981'
      });

      if (result.isConfirmed) {
        await orderActions.updateStatus(orderId, 'completed');
        refreshData();
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal mengkonfirmasi pesanan',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const handleReject = async (orderId) => {
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
        await orderActions.updateStatus(orderId, 'rejected');
        refreshData();
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal menolak pesanan',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  if (!Array.isArray(data)) {
    return (
      <div className="text-center py-8 text-gray-500">
        Tidak ada pesanan yang perlu dikonfirmasi
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Konfirmasi Pesanan</h2>

      <div className="space-y-4">
        {data.map((order) => (
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
                <span className={`px-3 py-1 rounded-full text-sm ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.status === 'completed' ? 'Selesai' :
                   order.status === 'pending' ? 'Menunggu' : 'Ditolak'}
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
                  onClick={() => handleReject(order.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Tolak Pesanan
                </button>
                <button
                  onClick={() => handleConfirm(order.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Konfirmasi Pesanan
                </button>
              </div>
            )}
          </motion.div>
        ))}

        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Tidak ada pesanan yang perlu dikonfirmasi
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderConfirmation;
