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
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    desc: 'Żar i ogień',
    preview: { bg: '#100A06', primary: '#FB923C', secondary: '#FCD34D' },
    vars: {
      '--bg': '#100A06',
      '--bg-elevated': '#1C1108',
      '--bg-card': '#150D07',
      '--border': '#2D1E0E',
      '--border-soft': '#221607',
      '--primary': '#FB923C',
      '--primary-rgb': '251, 146, 60',
      '--primary-dim': 'rgba(251, 146, 60, 0.15)',
      '--secondary': '#FCD34D',
      '--secondary-rgb': '252, 211, 77',
      '--text': '#FEF3EC',
      '--text-dim': '#D6A87A',
      '--muted': '#7C5C3A',
    },
  },
  {
    id: 'sakura',
    name: 'Sakura',
    desc: 'Nocny kwiat',
    preview: { bg: '#0E0810', primary: '#F472B6', secondary: '#A78BFA' },
    vars: {
      '--bg': '#0E0810',
      '--bg-elevated': '#1A1020',
      '--bg-card': '#130B18',
      '--border': '#2D1840',
      '--border-soft': '#201030',
      '--primary': '#F472B6',
      '--primary-rgb': '244, 114, 182',
      '--primary-dim': 'rgba(244, 114, 182, 0.15)',
      '--secondary': '#A78BFA',
      '--secondary-rgb': '167, 139, 250',
      '--text': '#FDF2F8',
      '--text-dim': '#E9A8CC',
      '--muted': '#7C5070',
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
