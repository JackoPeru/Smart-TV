export const colors = {
  dark: {
    '--bg-0': '#0B0F14',
    '--bg-1': '#121820',
    '--elev-1': '#161E28',
    '--elev-2': '#1B2633',
    '--text-1': '#E8EEF4',
    '--text-2': '#A9B4C0',
    '--warning': '#FFC24B',
    '--danger': '#FF5D5D',
    '--focus': '#FFFFFF',
  },
  light: {
    // Placeholder for optional light theme
    '--bg-0': '#FFFFFF',
    '--bg-1': '#F0F2F5',
    '--elev-1': '#FAFAFA',
    '--elev-2': '#E8EEF4',
    '--text-1': '#0B0F14',
    '--text-2': '#4A5568',
    '--warning': '#FFA000',
    '--danger': '#D32F2F',
    '--focus': '#000000',
  },
};

export const brands = {
  'Neon Blue': { '--brand': '#2D7DFF', '--accent': '#18D1A5' },
  'Emerald': { '--brand': '#18D1A5', '--accent': '#2D7DFF' },
  'Crimson': { '--brand': '#FF5D5D', '--accent': '#2D7DFF' },
};

export const typography = {
  fonts: {
    sans: 'Urbanist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  fontSizes: {
    '--font-size-1': '56px',
    '--font-size-2': '32px',
    '--font-size-3': '24px',
    '--font-size-4': '18px',
    '--font-size-5': '16px',
  },
  fontWeights: {
    '--font-weight-regular': '400',
    '--font-weight-semibold': '600',
  },
};

export const spacing = {
  '--space-1': '8px',
  '--space-2': '16px',
  '--space-3': '24px',
  '--space-4': '32px',
  '--space-5': '40px',
  '--space-6': '48px', // Safe area
};

export const radii = {
  '--radius-1': '16px',
  '--radius-2': '20px',
};

export const shadows = {
  '--shadow-1': '0px 4px 8px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.06)',
  '--shadow-2': '0px 10px 20px rgba(0, 0, 0, 0.15), 0px 3px 8px rgba(0, 0, 0, 0.1)',
};

export const transitions = {
  '--transition-1': '200ms cubic-bezier(0.33, 1, 0.68, 1)', // Easing out-cubic
};
