// Única fuente de color. Es JS plano porque también la lee tailwind.config.js, que no pasa por TypeScript.
const palette = {
  canvas: '#F6F7F9',
  surface: '#FFFFFF',
  ink: '#17171C',
  inkSoft: '#5E6068',
  line: '#E3E5EA',
  accent: '#2340E0',
  accentSoft: '#E4E8FD',
  onAccent: '#FFFFFF',
  danger: '#C4352B',
  dangerBg: '#FDE3E0',
  quiet: '#E7E9EE',
  lavanda: '#D9D2FF',
  lavandaInk: '#241A5C',
  menta: '#C6EFD9',
  mentaInk: '#0E3B26',
  durazno: '#FFD3BF',
  duraznoInk: '#4A1D0B',
  mantequilla: '#FFEFA8',
  mantequillaInk: '#3D3102',
};

module.exports = { palette };
