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
    id: 'solar',
    name: 'Solar',
    desc: 'Jasny, energetyczny',
    preview: { bg: '#FFFBF0', primary: '#F59E0B', secondary: '#EF4444' },
    vars: {
      '--bg': '#FFFBF0',
      '--bg-elevated': '#FFF3D0',
      '--bg-card': '#FFFFFF',
      '--border': '#E8D9A0',
      '--border-soft': '#F0E8C0',
      '--primary': '#D97706',
      '--primary-rgb': '217, 119, 6',
      '--primary-dim': 'rgba(217, 119, 6, 0.12)',
      '--secondary': '#DC2626',
      '--secondary-rgb': '220, 38, 38',
      '--text': '#1C1200',
      '--text-dim': '#6B5500',
      '--muted': '#A08040',
      '--topbar-bg': 'rgba(255, 251, 240, 0.92)',
      '--overlay-bg': 'rgba(28, 18, 0, 0.6)',
      '--track-bg': 'rgba(232, 217, 160, 0.6)',
    },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    desc: 'Czysty, lodowy chłód',
    preview: { bg: '#F0F8FF', primary: '#0EA5E9', secondary: '#8B5CF6' },
    vars: {
      '--bg': '#F0F8FF',
      '--bg-elevated': '#E0F0FF',
      '--bg-card': '#FFFFFF',
      '--border': '#BAD8F0',
      '--border-soft': '#D0E8F8',
      '--primary': '#0284C7',
      '--primary-rgb': '2, 132, 199',
      '--primary-dim': 'rgba(2, 132, 199, 0.12)',
      '--secondary': '#7C3AED',
      '--secondary-rgb': '124, 58, 237',
      '--text': '#0A1628',
      '--text-dim': '#2D5070',
      '--muted': '#6090B0',
      '--topbar-bg': 'rgba(240, 248, 255, 0.92)',
      '--overlay-bg': 'rgba(10, 22, 40, 0.6)',
      '--track-bg': 'rgba(186, 216, 240, 0.6)',
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
