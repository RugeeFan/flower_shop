import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "sans"],
      },
      colors: {
        primary: {
          DEFAULT: "#8D9E91", // 主色调
          light: "",  // 浅色变体
          dark: "",    // 深色变体
        },
        text: {
          DEFAULT: "#333333", // 默认文本颜色
          light: "#FAF9F9",   // 浅色文本
          dark: "#333333",    // 深色文本
          hover: "#535351",   // 悬停文本颜色
        },
      },
    },
  },
  plugins: [],
} satisfies Config;