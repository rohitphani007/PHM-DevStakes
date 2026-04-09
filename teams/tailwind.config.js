/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09090B",
        accent: "#EAB308",
      },
    },
  },
  plugins: [],
};
