import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Slide-in cart panel shown on the right.
 * Props: 
 *  - isOpen, onClose
 *  - cart, removeFromCart, updateQuantity
 *  - customerName, setCustomerName, tableNumber, setTableNumber
 *  - calculateTotal, handleCreateOrder
 */
const CartPanel = ({
  isOpen,
  onClose,
  cart,
  removeFromCart,
  updateQuantity,
  customerName,
  setCustomerName,
  tableNumber,
  setTableNumber,
  calculateTotal,
  handleCreateOrder,

}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween" }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-background-card z-50 overflow-y-auto shadow-xl p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">Keranjang</h2>
              <button
                onClick={onClose}
                className="text-primary hover:text-accent focus:outline-none"
                aria-label="Tutup Keranjang"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="text-text">Keranjang kosong</p>
            ) : (
              <div className="space-y-6">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 py-4 border-b border-primary/10">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-primary/10" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary text-sm sm:text-base">{item.name}</h3>
                      <p className="text-text text-xs sm:text-sm">Rp {item.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* Qty - */}
                      <button
                        className="px-2 py-1 text-primary hover:bg-primary/10 disabled:opacity-40 rounded"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-primary">{item.quantity}</span>
                      {/* Qty + */}
                      <button
                        className="px-2 py-1 text-primary hover:bg-primary/10 disabled:opacity-40 rounded"
                        onClick={() => updateQuantity(item.id, Math.min(item.quantity + 1, item.stock))}
                        disabled={item.quantity >= item.stock}
                      >
                        +
                      </button>
                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-accent hover:text-accent-dark text-sm"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}

                {/* Customer info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-primary">Nama Pelanggan</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-background text-text border border-primary/30 rounded-md focus:ring-primary/30 focus:border-primary"
                      placeholder="Masukkan nama pelanggan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary">Nomor Meja</label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-background text-text border border-primary/30 rounded-md focus:ring-primary/30 focus:border-primary"
                      placeholder="Masukkan nomor meja"
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-b border-primary/20 py-4 mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-primary">Total</h3>
                    <p className="text-lg font-bold text-primary">Rp {calculateTotal().toLocaleString()}</p>
                  </div>
                </div>

                {/* Button */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => {
                      handleCreateOrder();
                      onClose();
                    }}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-200 shadow-sm font-semibold w-full"
                  >
                    Buat Pesanan
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartPanel;
