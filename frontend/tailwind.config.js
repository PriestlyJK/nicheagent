/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#0f0f0f",
          soft:    "#1a1a1a",
        },
        surface: {
          DEFAULT: "#ffffff",
          soft:    "#f8f8f7",
          muted:   "#f1f0ee",
          border:  "rgba(0,0,0,0.08)",
          hover:   "rgba(0,0,0,0.04)",
        },
        text: {
          primary:   "#0f0f0f",
          secondary: "#6b6b6b",
          tertiary:  "#9b9b9b",
        },
        accent: {
          purple: { DEFAULT: "#534AB7", light: "#EEEDFE", dark: "#3C3489" },
          teal:   { DEFAULT: "#1D9E75", light: "#E1F5EE", dark: "#0F6E56" },
          coral:  { DEFAULT: "#D85A30", light: "#FAECE7", dark: "#993C1D" },
          amber:  { DEFAULT: "#BA7517", light: "#FAEEDA", dark: "#854F0B" },
          green:  { DEFAULT: "#3B6D11", light: "#EAF3DE", dark: "#27500A" },
        },
      },
      borderRadius: {
        sm:  "6px",
        md:  "8px",
        lg:  "12px",
        xl:  "16px",
        "2xl": "20px",
      },
      fontSize: {
        "2xs": ["10px", "14px"],
        xs:    ["11px", "16px"],
        sm:    ["12px", "18px"],
        base:  ["13px", "20px"],
        md:    ["14px", "22px"],
        lg:    ["15px", "24px"],
        xl:    ["17px", "26px"],
        "2xl": ["20px", "28px"],
        "3xl": ["24px", "32px"],
      },
    },
  },
  plugins: [],
}
