/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          300: "#6ee7b7",
          500: "#10b981",
          700: "#047857",
          900: "#064e3b"
        },
        accent: {
          100: "#fef3c7",
          300: "#fcd34d",
          500: "#f59e0b"
        }
      },
      boxShadow: {
        card: "0 20px 45px rgba(15, 23, 42, 0.08)",
        soft: "0 12px 24px rgba(15, 23, 42, 0.06)"
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        rise: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0px)" }
        }
      },
      animation: {
        floaty: "floaty 4s ease-in-out infinite",
        rise: "rise 450ms ease-out"
      }
    }
  },
  plugins: []
};
