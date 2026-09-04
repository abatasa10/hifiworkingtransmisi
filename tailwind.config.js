/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./dashboard_proteksi2.html"],
  theme: {
    extend: {
      fontFamily: { sans: ["Plus Jakarta Sans", "sans-serif"] },
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#e1ebff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
    },
  },
  plugins: [],
};
