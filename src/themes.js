export const THEMES = [
  {
    id: 'onyx',
    name: 'Onyx',
    desc: 'Limonkowy klasyk',
    preview: { bg: '#0F1111', primary: '#CCFF00', secondary: '#00FDFF' },
    vars: {
      '--bg': '#0F1111',
      '--bg-elevated': '#181A1A',
      '--bg-card': '#141616',
      '--border': '#262828',
      '--border-soft': '#1F2121',
      '--primary': '#CCFF00',
      '--primary-rgb': '204, 255, 0',
      '--primary-dim': 'rgba(204, 255, 0, 0.15)',
      '--secondary': '#00FDFF',
      '--secondary-rgb': '0, 253, 255',
      '--text': '#F5F5F5',
      '--text-dim': '#B8BBBB',
      '--muted': '#6F7373',
      '--topbar-bg': 'rgba(15, 17, 17, 0.88)',
      '--overlay-bg': 'rgba(5, 7, 7, 0.78)',
      '--track-bg': 'rgba(38, 40, 40, 0.8)',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    desc: 'Głęboki błękit',
    preview: { bg: '#070B14', primary: '#38BFF8', secondary: '#818CF8' },
    vars: {
      '--bg': '#070B14',
      '--bg-elevated': '#0D1525',
      '--bg-card': '#0A1020',
      '--border': '#162040',
      '--border-soft': '#111830',
      '--primary': '#38BFF8',
      '--primary-rgb': '56, 191, 248',
      '--primary-dim': 'rgba(56, 191, 248, 0.15)',
      '--secondary': '#818CF8',
      '--secondary-rgb': '129, 140, 248',
      '--text': '#E2E8F0',
      '--text-dim': '#94A3B8',
      '--muted': '#4A5A72',
      '--topbar-bg': 'rgba(7, 11, 20, 0.9)',
      '--overlay-bg': 'rgba(4, 7, 14, 0.82)',
      '--track-bg': 'rgba(22, 32, 64, 0.8)',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    desc: 'Czysty minimalizm',
    preview: { bg: '#0C0C0C', primary: '#E5E5E5', secondary: '#888888' },
    vars: {
      '--bg': '#0C0C0C',
      '--bg-elevated': '#161616',
      '--bg-card': '#111111',
      '--border': '#252525',
      '--border-soft': '#1D1D1D',
      '--primary': '#E5E5E5',
      '--primary-rgb': '229, 229, 229',
      '--primary-dim': 'rgba(229, 229, 229, 0.1)',
      '--secondary': '#888888',
      '--secondary-rgb': '136, 136, 136',
      '--text': '#FFFFFF',
      '--text-dim': '#AAAAAA',
      '--muted': '#555555',
      '--topbar-bg': 'rgba(12, 12, 12, 0.92)',
      '--overlay-bg': 'rgba(0, 0, 0, 0.8)',
      '--track-bg': 'rgba(37, 37, 37, 0.8)',
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    desc: 'Jaskrawy cyberpunk',
    preview: { bg: '#070709', primary: '#39FF14', secondary: '#FF073A' },
    vars: {
      '--bg': '#070709',
      '--bg-elevated': '#0F0F14',
      '--bg-card': '#0C0C12',
      '--border': '#1E1E2E',
      '--border-soft': '#16161F',
      '--primary': '#39FF14',
      '--primary-rgb': '57, 255, 20',
      '--primary-dim': 'rgba(57, 255, 20, 0.14)',
      '--secondary': '#FF073A',
      '--secondary-rgb': '255, 7, 58',
      '--text': '#F0F0FF',
      '--text-dim': '#A0A0C0',
      '--muted': '#505070',
      '--topbar-bg': 'rgba(7, 7, 9, 0.92)',
      '--overlay-bg': 'rgba(4, 4, 6, 0.82)',
      '--track-bg': 'rgba(30, 30, 46, 0.8)',
    },
  },
  {
    id: 'violet',
    name: 'Violet',
    desc: 'Elektryczny fiolet',
    preview: { bg: '#0C0815', primary: '#BF5FFF', secondary: '#00EAFF' },
    vars: {
      '--bg': '#0C0815',
      '--bg-elevated': '#140F22',
      '--bg-card': '#100C1C',
      '--border': '#281840',
      '--border-soft': '#1E1230',
      '--primary': '#BF5FFF',
      '--primary-rgb': '191, 95, 255',
      '--primary-dim': 'rgba(191, 95, 255, 0.15)',
      '--secondary': '#00EAFF',
      '--secondary-rgb': '0, 234, 255',
      '--text': '#F4EEFF',
      '--text-dim': '#B090D0',
      '--muted': '#604880',
      '--topbar-bg': 'rgba(12, 8, 21, 0.92)',
      '--overlay-bg': 'rgba(6, 4, 12, 0.82)',
      '--track-bg': 'rgba(40, 24, 64, 0.8)',
    },
  },
]

const STORAGE_KEY = 'pushup-theme'

export function applyTheme(themeId) {
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value)
  }
  localStorage.setItem(STORAGE_KEY, theme.id)
  return theme
}

export function loadSavedTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && saved !== 'onyx') {
    applyTheme(saved)
    return saved
  }
  return 'onyx'
}
