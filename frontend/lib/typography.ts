// Typography utility classes
export const typography = {
  // Display text - DM Serif Display
  display: {
    xl: 'font-display text-6xl md:text-8xl font-normal tracking-tight',
    lg: 'font-display text-5xl md:text-6xl font-normal tracking-tight',
    md: 'font-display text-4xl md:text-5xl font-normal tracking-tight',
    sm: 'font-display text-3xl md:text-4xl font-normal tracking-tight',
  },
  
  // Headings - DM Sans
  heading: {
    h1: 'font-sans text-4xl md:text-5xl font-bold tracking-tight',
    h2: 'font-sans text-3xl md:text-4xl font-bold tracking-tight',
    h3: 'font-sans text-2xl md:text-3xl font-semibold tracking-tight',
    h4: 'font-sans text-xl md:text-2xl font-semibold',
    h5: 'font-sans text-lg md:text-xl font-semibold',
    h6: 'font-sans text-base md:text-lg font-semibold',
  },
  
  // Body text - DM Sans
  body: {
    xl: 'font-sans text-xl font-normal leading-relaxed',
    lg: 'font-sans text-lg font-normal leading-relaxed',
    base: 'font-sans text-base font-normal leading-normal',
    sm: 'font-sans text-sm font-normal leading-normal',
    xs: 'font-sans text-xs font-normal leading-tight',
  },
  
  // Special
  mono: 'font-mono text-sm',
  label: 'font-sans text-xs font-medium uppercase tracking-wider',
  
  // Weights
  weight: {
    light: 'font-light', // 300
    normal: 'font-normal', // 400
    medium: 'font-medium', // 500
    semibold: 'font-semibold', // 600
    bold: 'font-bold', // 700
  }
};
