import React from 'react';

/**
 * Floating button to toggle the cart panel.
 * Props:
 *  - cartCount: number of items in cart
 *  - onClick: handler
 */
const CartToggleButton = ({ cartCount = 0, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 z-40 flex items-center space-x-1 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      aria-label="Buka Keranjang"
    >
      {/* Cart icon */}
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      {/* Badge */}
      {cartCount > 0 && (
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-primary bg-white rounded-full">
          {cartCount}
        </span>
      )}
      <span className="hidden sm:inline-block text-sm font-medium">Keranjang</span>
    </button>
  );
};

export default CartToggleButton;
