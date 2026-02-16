/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        washi: "#F5F5F0",
        sumi: "#2D2D2D",
        stone: "#8E8E93",
      },
      fontFamily: {
        serif: ["NotoSerifJP_400Regular", "serif"],
        sans: ["NotoSansJP_400Regular", "sans-serif"],
      },
    },
  },
  plugins: [],
};
