/** @type {import('tailwindcss').Config} */
// 专业简洁版：深色底 + 一个狐狸橙强调色；衬线做标题、无衬线做正文、等宽做标签
const sans = ['Instrument Sans', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif']
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0C0C0C',
        surface: '#141518',
        ink: '#E7EDF2',
        muted: '#9BA5AE',
        fox: '#F0904E',
      },
      fontFamily: {
        sans,
        kanit: sans,
        display: ['Instrument Serif', 'Noto Serif SC', 'Songti SC', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
