/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tema Retro Kopi
        primary: {
          DEFAULT: '#6F4E37', // Coklat kopi
          light: '#8A6D4D',
          dark: '#5A3E27',
        },
        secondary: {
          DEFAULT: '#5A7684', // Biru keabu-abuan
          light: '#7A96A4',
          dark: '#465D69',
        },
        accent: {
          DEFAULT: '#FF8C00', // Oranye
          light: '#FFAA33',
          dark: '#E67E00',
        },
        background: {
          DEFAULT: '#F5F5F5', // Putih atau abu muda
          card: '#FFFFFF',
          dark: '#EBEBEB',
        },
        text: {
          DEFAULT: '#333333', // Hitam pekat
          light: '#666666',
          lighter: '#999999',
        },
      },
    },
  },
  plugins: [],
}