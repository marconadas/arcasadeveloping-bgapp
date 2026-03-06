export type Theme = 'light' | 'dark';

export const getThemeStyles = (theme: Theme) => ({
  // Card backgrounds
  cardBackground: theme === 'light'
    ? 'bg-white/95 backdrop-blur-md'
    : 'bg-slate-900 backdrop-blur-xl',

  // Card borders and shadows
  cardBorder: theme === 'light'
    ? 'border border-gray-200/50 shadow-2xl ring-1 ring-black/5'
    : 'border border-slate-700/50 shadow-2xl ring-1 ring-white/10',

  // Text colors
  primaryText: theme === 'light' ? 'text-gray-900' : 'text-white',
  secondaryText: theme === 'light' ? 'text-gray-600' : 'text-white',
  mutedText: theme === 'light' ? 'text-gray-500' : 'text-gray-200',

  // Interactive elements
  buttonHover: theme === 'light'
    ? 'hover:bg-gray-100'
    : 'hover:bg-slate-800',

  // Sidebar
  sidebarBackground: theme === 'light'
    ? 'bg-white/95 backdrop-blur-md border-r border-gray-200/50'
    : 'bg-slate-900 backdrop-blur-xl border-r border-slate-700/50',

  // Status indicators
  statusConnected: 'bg-green-500',
  statusDisconnected: 'bg-red-500',

  // Map overlays
  mapOverlay: theme === 'light'
    ? 'bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-2xl ring-1 ring-black/5'
    : 'bg-slate-900 backdrop-blur-xl border border-slate-700/50 shadow-2xl ring-1 ring-white/10',

  // Error notifications
  errorBackground: theme === 'light'
    ? 'bg-red-50/95 border border-red-200/50'
    : 'bg-red-900/80 border border-red-500/20',

  errorText: theme === 'light' ? 'text-red-800' : 'text-red-200',

  // Controls
  controlButton: theme === 'light'
    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
    : 'bg-slate-800/90 hover:bg-slate-700/90 text-white',

  // Zoom controls
  zoomButton: theme === 'light'
    ? 'bg-white/90 hover:bg-gray-50 border border-gray-200/50 text-gray-700'
    : 'bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/50 text-white',

  // Font weights for better dark mode readability
  labelWeight: theme === 'light' ? 'font-medium' : 'font-semibold',
  iconColor: theme === 'light' ? 'text-gray-500' : 'text-gray-300'
});

export const getThemeClasses = (theme: Theme, component: string) => {
  const styles = getThemeStyles(theme);

  switch (component) {
    case 'card':
      return `${styles.cardBackground} ${styles.cardBorder}`;

    case 'sidebar':
      return `${styles.sidebarBackground} shadow-2xl ring-1 ${theme === 'light' ? 'ring-black/5' : 'ring-white/10'}`;

    case 'mapOverlay':
      return styles.mapOverlay;

    case 'button':
      return `${styles.controlButton} transition-colors rounded-lg`;

    case 'zoomButton':
      return `${styles.zoomButton} transition-colors shadow-lg`;

    default:
      return '';
  }
};