// Primary Brand Colors
export const Colors = {
  // Primary Orange (BonkDotCapital brand)
  primary: '#f97316',
  primaryLight: '#fed7aa',
  primaryDark: '#ea580c',
  
  // Background Colors
  background: '#fef7ed', // slight orange hue background
  backgroundLight: '#fafaf9',
  backgroundWhite: '#ffffff',
  
  // Text Colors
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textLight: '#ffffff',
  
  // Status Colors
  success: '#10b981',
  successLight: '#dcfce7',
  successDark: '#059669',
  
  info: '#3b82f6',
  infoLight: '#dbeafe',
  infoDark: '#2563eb',
  
  warning: '#fbbf24',
  warningLight: '#fef3c7',
  warningDark: '#f59e0b',
  
  error: '#ef4444',
  errorLight: '#fee2e2',
  errorDark: '#dc2626',
  
  // Purple (for stats and special elements)
  purple: '#8b5cf6',
  purpleLight: '#e9d5ff',
  purpleDark: '#7c3aed',
  
  // Border and Divider Colors
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  borderDark: '#d1d5db',
  
  // Shadow Colors
  shadow: '#000000',
  shadowPrimary: '#f97316',
  shadowInfo: '#3b82f6',
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(255, 255, 255, 0.9)',
} as const;

// Semantic color mappings for specific use cases
export const SemanticColors = {
  // Lending/Borrowing tags
  lending: {
    background: Colors.successLight,
    text: Colors.successDark,
  },
  borrowing: {
    background: Colors.infoLight,
    text: Colors.infoDark,
  },
  
  // Tab navigation
  tabActive: Colors.primary,
  tabInactive: Colors.textSecondary,
  
  // Buttons
  buttonPrimary: Colors.primary,
  buttonSecondary: Colors.info,
  buttonSuccess: Colors.success,
  
  // Cards and sections
  cardBackground: Colors.backgroundWhite,
  cardShadow: Colors.shadow,
  
  // Progress bars
  progressBackground: Colors.border,
  progressFill: Colors.textPrimary,
} as const;

// Opacity variants for backgrounds
export const ColorOpacity = {
  primary10: Colors.primary + '1A', // 10% opacity
  primary20: Colors.primary + '33', // 20% opacity
  success10: Colors.success + '1A',
  success20: Colors.success + '33',
  info10: Colors.info + '1A',
  info20: Colors.info + '33',
  purple10: Colors.purple + '1A',
  purple20: Colors.purple + '33',
} as const; 