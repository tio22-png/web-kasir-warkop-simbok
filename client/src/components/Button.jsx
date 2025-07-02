import React from 'react';

const Button = ({ text, onClick, variant = "primary" }) => {
  const buttonStyles = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    secondary: "bg-gray-500 hover:bg-gray-600 text-white",
    success: "bg-green-500 hover:bg-green-600 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white"
  };

  return (
    <button 
      onClick={onClick}
      className={`
        ${buttonStyles[variant]}
        px-4 py-2 rounded-lg
        font-semibold
        transition duration-300 ease-in-out
        transform hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${variant === 'primary' ? 'blue' : variant === 'secondary' ? 'gray' : variant === 'success' ? 'green' : 'red'}-500
      `}
    >
      {text}
    </button>
  );
};

export default Button;
