import { StyleSheet, Platform } from 'react-native';

const createStyles = (brandColors, insets) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      elevation: 1000,
    },
    wrapper: {
      paddingHorizontal: 0,
      paddingTop: 0,
      backgroundColor: 'transparent',
    },
    toolbarShadow: {
      minHeight: 60,
      borderTopWidth: 1,
      borderTopColor: brandColors.border,
      backgroundColor: brandColors.background,
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: Math.max(insets?.bottom || 0, 10),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...Platform.select({
        ios: {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.12,
          shadowRadius: 14,
        },
        android: { elevation: 10 },
        web: { boxShadow: '0 -6px 20px rgba(15,23,42,0.12)' },
      }),
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    iconWrap: {
      width: 24,
      height: 24,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
      overflow: 'hidden',
    },
    iconWrapActive: {
      backgroundColor: `${brandColors.primary}18`,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: brandColors.textSecondary,
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    labelActive: {
      color: brandColors.primary,
      fontWeight: '800',
    },
  });

export default createStyles;
