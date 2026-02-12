// Color utility classes for the new color scheme
export const colors = {
  // Backgrounds
  bg: {
    primary: 'bg-grey-50 dark:bg-grey-950',
    surface: 'bg-white dark:bg-grey-900',
    elevated: 'bg-grey-100 dark:bg-grey-800',
    hover: 'hover:bg-grey-100 dark:hover:bg-grey-800',
  },
  
  // Text
  text: {
    primary: 'text-grey-900 dark:text-grey-50',
    secondary: 'text-grey-600 dark:text-grey-300',
    tertiary: 'text-grey-500 dark:text-grey-400',
    muted: 'text-grey-400 dark:text-grey-500',
  },
  
  // Borders
  border: {
    default: 'border-grey-200 dark:border-grey-800',
    hover: 'hover:border-grey-300 dark:hover:border-grey-700',
    focus: 'focus:border-grey-400 dark:focus:border-grey-600',
  },
  
  // Accent
  accent: {
    bg: 'bg-pink-accent',
    text: 'text-pink-accent',
    border: 'border-pink-accent',
    hover: 'hover:bg-pink-accent/90',
  },
  
  // Polkadot brand colors (keep for specific use)
  polkadot: {
    pink: 'text-polkadot-pink',
    pinkBg: 'bg-polkadot-pink',
  }
};

// Commonly used combinations
export const combos = {
  card: `${colors.bg.surface} ${colors.border.default} ${colors.text.primary}`,
  cardHover: `${colors.bg.hover} ${colors.border.hover}`,
  input: `${colors.bg.surface} ${colors.border.default} ${colors.text.primary} focus:${colors.border.focus}`,
  button: {
    primary: `${colors.accent.bg} text-white ${colors.accent.hover}`,
    secondary: `${colors.bg.elevated} ${colors.text.primary} ${colors.bg.hover}`,
  }
};
