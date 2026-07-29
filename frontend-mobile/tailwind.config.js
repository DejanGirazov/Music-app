/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  "./src/app/**/*.{js,jsx,ts,tsx}",
  "./src/components/**/*.{js,jsx,ts,tsx}",  // adjust if components also moved
],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};