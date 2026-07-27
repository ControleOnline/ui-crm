/*
 * @agents Keep the visual tokens for the settings page centralized here.
 * The screen and its sections should share the same spacing, radius, and typography rhythm.
 */
import {useMemo} from 'react';
import {StyleSheet} from 'react-native';

import {useStore} from '@store';

const normalizeGeneralSettingsThemeColors = themeColors => {
  if (!themeColors) {
    return {};
  }

  if (typeof themeColors === 'object' && !Array.isArray(themeColors)) {
    return themeColors;
  }

  if (typeof themeColors !== 'string') {
    return {};
  }

  try {
    const parsedColors = JSON.parse(themeColors);
    return parsedColors &&
      typeof parsedColors === 'object' &&
      !Array.isArray(parsedColors)
      ? parsedColors
      : {};
  } catch {
    return {};
  }
};

export const buildGeneralSettingsPalette = themeColors => ({
  badgeBorder: themeColors.badgeBorder,
  badgeDisabledBackground: themeColors.badgeDisabledBackground,
  badgeDisabledText: themeColors.badgeDisabledText,
  badgeSelectedBackground: themeColors.badgeSelectedBackground,
  badgeSelectedBorder: themeColors.badgeSelectedBorder,
  badgeSelectedText: themeColors.badgeSelectedText,
  buttonBackground: themeColors.buttonBackground,
  buttonBackgroundSecondary: themeColors.buttonBackgroundSecondary,
  buttonBorderSecondary: themeColors.buttonBorderSecondary,
  buttonIcon: themeColors.buttonIcon,
  buttonText: themeColors.buttonText,
  buttonTextSecondary: themeColors.buttonTextSecondary,
  cardBackground: themeColors.cardBackground,
  cardBorder: themeColors.cardBorder,
  cardIconColor: themeColors.cardIconColor,
  cardIconBackground: themeColors.cardIconBackground,
  cardIconBorder: themeColors.cardIconBorder,
  cardText: themeColors.cardText,
  containerTransparentBackground: themeColors.containerTransparentBackground,
  error: themeColors.error,
  iconActive: themeColors.iconActive,
  iconDanger: themeColors.iconDanger,
  iconDisabled: themeColors.iconDisabled,
  iconInfo: themeColors.iconInfo,
  iconSuccess: themeColors.iconSuccess,
  iconWarning: themeColors.iconWarning,
  info: themeColors.info,
  inputBackground: themeColors.inputBackground,
  inputBorder: themeColors.inputBorder,
  inputDisabledBackground: themeColors.inputDisabledBackground,
  inputDisabledText: themeColors.inputDisabledText,
  inputIcon: themeColors.inputIcon,
  inputPlaceholderText: themeColors.inputPlaceholderText,
  inputText: themeColors.inputText,
  listItemBackground: themeColors.listItemBackground,
  listItemBorder: themeColors.listItemBorder,
  listItemSelectedBackground: themeColors.listItemSelectedBackground,
  listItemSelectedBorder: themeColors.listItemSelectedBorder,
  listItemSubtitleText: themeColors.listItemSubtitleText,
  listItemText: themeColors.listItemText,
  loadingSpinner: themeColors.loadingSpinner,
  modalBackground: themeColors.modalBackground,
  modalBorder: themeColors.modalBorder,
  modalCloseIcon: themeColors.modalCloseIcon,
  modalHeaderText: themeColors.modalHeaderText,
  modalText: themeColors.modalText,
  navigationActiveBackground: themeColors.navigationActiveBackground,
  navigationBackground: themeColors.navigationBackground,
  navigationBorder: themeColors.navigationBorder,
  navigationText: themeColors.navigationText,
  pageBackground: themeColors.pageBackground,
  primary: themeColors.primary,
  success: themeColors.success,
  switchDisabledThumb: themeColors.switchDisabledThumb,
  switchDisabledTrack: themeColors.switchDisabledTrack,
  switchOffThumb: themeColors.switchOffThumb,
  switchOffTrack: themeColors.switchOffTrack,
  switchOnThumb: themeColors.switchOnThumb,
  switchOnTrack: themeColors.switchOnTrack,
  textMuted: themeColors.textMuted,
  textPrimary: themeColors.textPrimary,
  textSecondary: themeColors.textSecondary,
  warning: themeColors.warning,
});

export const getGeneralSettingsSwitchProps = ({
  disabled = false,
  palette,
  value = false,
}) => {
  const offTrackColor = disabled
    ? palette.switchDisabledTrack
    : palette.switchOffTrack;
  const onTrackColor = disabled
    ? palette.switchDisabledTrack
    : palette.switchOnTrack;

  return {
    ios_backgroundColor: offTrackColor,
    thumbColor: disabled
      ? palette.switchDisabledThumb
      : value
        ? palette.switchOnThumb
        : palette.switchOffThumb,
    trackColor: {
      false: offTrackColor,
      true: onTrackColor,
    },
  };
};

export const createGeneralSettingsStyles = palette =>
  StyleSheet.create({
    pageTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: palette.textPrimary,
      marginTop: 16,
    },
    pageSubtitle: {
      fontSize: 14,
      color: palette.textSecondary,
      marginTop: 6,
      marginBottom: 18,
    },
    tabBar: {
      backgroundColor: palette.navigationBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.navigationBorder,
    },
    tabBarContent: {
      flexDirection: 'row',
    },
    tabItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 2.5,
      borderBottomColor: palette.containerTransparentBackground,
    },
    tabItemActive: {
      backgroundColor: palette.navigationActiveBackground,
    },
    tabLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: palette.navigationText,
    },
    tabLabelActive: {
      fontWeight: '700',
    },
    tabHelper: {
      fontSize: 13,
      lineHeight: 18,
      color: palette.textSecondary,
      marginTop: 10,
      marginBottom: 18,
    },
    sectionCard: {
      backgroundColor: palette.cardBackground,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      padding: 18,
      marginBottom: 18,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    sectionIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: palette.cardIconBorder,
      marginRight: 12,
    },
    sectionHeaderCopy: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: palette.cardText,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitleHelp: {
      marginLeft: 8,
    },
    sectionDescription: {
      fontSize: 13,
      lineHeight: 18,
      color: palette.textSecondary,
      marginTop: 4,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    settingCopy: {
      flex: 1,
      marginRight: 12,
    },
    settingDescription: {
      fontSize: 12,
      lineHeight: 18,
      color: palette.textSecondary,
      marginTop: 4,
    },
    statusLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.textPrimary,
    },
    statusChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.badgeBorder,
    },
    statusChipEnabled: {
      backgroundColor: palette.badgeSelectedBackground,
      borderColor: palette.badgeSelectedBorder,
    },
    statusChipDisabled: {
      backgroundColor: palette.badgeDisabledBackground,
    },
    statusChipText: {
      fontSize: 13,
      fontWeight: '700',
      marginLeft: 6,
    },
    helperText: {
      fontSize: 13,
      color: palette.textSecondary,
      marginBottom: 14,
    },
    emptyBox: {
      borderRadius: 14,
      backgroundColor: palette.pageBackground,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      padding: 14,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: palette.textPrimary,
      marginBottom: 4,
    },
    emptyText: {
      fontSize: 13,
      lineHeight: 18,
      color: palette.textSecondary,
    },
    printerList: {
      gap: 10,
    },
    printerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.listItemBorder,
      backgroundColor: palette.listItemBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    printerItemActive: {
      borderColor: palette.listItemSelectedBorder,
      backgroundColor: palette.listItemSelectedBackground,
    },
    printerCopy: {
      flex: 1,
      marginLeft: 12,
    },
    printerName: {
      fontSize: 14,
      fontWeight: '700',
      color: palette.listItemText,
    },
    printerDevice: {
      fontSize: 12,
      color: palette.listItemSubtitleText,
      marginTop: 2,
    },
    franchiseAddressGroupList: {
      gap: 12,
    },
    franchiseAddressGroup: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.cardBackground,
      padding: 14,
    },
    franchiseAddressGroupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    franchiseAddressGroupBadge: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.cardIconBackground,
      borderWidth: 1,
      borderColor: palette.cardIconBorder,
    },
    franchiseAddressGroupCopy: {
      flex: 1,
      marginLeft: 10,
    },
    franchiseAddressAddBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.buttonBackgroundSecondary,
      borderWidth: 1,
      borderColor: palette.buttonBorderSecondary,
      marginLeft: 8,
    },
    franchiseAddressOptionList: {
      gap: 8,
    },
    franchiseAddressOption: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.listItemBorder,
      backgroundColor: palette.listItemBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    franchiseAddressOptionActive: {
      borderColor: palette.listItemSelectedBorder,
      backgroundColor: palette.listItemSelectedBackground,
    },
    franchiseAddressOptionCopy: {
      flex: 1,
      marginLeft: 12,
    },
    primaryButton: {
      marginTop: 16,
      justifyContent: 'center',
    },
    secondaryButton: {
      marginTop: 10,
      justifyContent: 'center',
      backgroundColor: palette.buttonBackgroundSecondary,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      color: palette.buttonText,
      fontWeight: '700',
    },
    fieldBlock: {
      marginTop: 16,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.textPrimary,
      marginBottom: 6,
    },
    selectorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    selectorInput: {
      flex: 1,
      marginTop: 0,
    },
    selectorListButton: {
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: palette.buttonBackground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectorListButtonText: {
      color: palette.buttonText,
      fontSize: 13,
      fontWeight: '700',
      marginLeft: 6,
    },
    input: {
      minHeight: 48,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: palette.inputBorder,
      backgroundColor: palette.inputBackground,
      color: palette.inputText,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 6,
    },
    inputDisabled: {
      backgroundColor: palette.inputDisabledBackground,
      color: palette.inputDisabledText,
    },
    multilineInput: {
      minHeight: 96,
      textAlignVertical: 'top',
    },
    logPolicyList: {
      gap: 12,
    },
    logPolicyCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.pageBackground,
      padding: 14,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    profileInput: {
      flex: 1,
      marginTop: 0,
    },
    profileInputSpacing: {
      marginLeft: 10,
    },
    removeProfileButton: {
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      height: 34,
      justifyContent: 'center',
      marginLeft: 10,
      width: 34,
    },
    selectionModal: {
      backgroundColor: palette.modalBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      height: '88%',
      paddingBottom: 20,
    },
    selectionModalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: palette.modalBorder,
    },
    selectionModalHeaderCopy: {
      flex: 1,
      marginRight: 12,
    },
    selectionModalTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: palette.modalHeaderText,
    },
    selectionModalSubtitle: {
      fontSize: 12,
      lineHeight: 18,
      color: palette.modalText,
      marginTop: 4,
    },
    selectionModalClose: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: palette.inputBackground,
      borderWidth: 1,
      borderColor: palette.inputBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectionSearchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: palette.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.inputBorder,
    },
    selectionSearchIcon: {
      marginRight: 8,
    },
    selectionSearchInput: {
      flex: 1,
      fontSize: 14,
      color: palette.inputText,
      padding: 0,
    },
    selectionModalList: {
      flex: 1,
      marginTop: 12,
    },
    selectionModalListContent: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    selectionModalActionButton: {
      flex: 0,
      minHeight: 52,
      marginHorizontal: 16,
      marginTop: 16,
      paddingHorizontal: 20,
      borderRadius: 16,
      alignSelf: 'stretch',
    },
    selectionModalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.listItemBorder,
      backgroundColor: palette.listItemBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 10,
    },
    selectionModalItemActive: {
      borderColor: palette.listItemSelectedBorder,
      backgroundColor: palette.listItemSelectedBackground,
    },
    selectionModalItemCopy: {
      flex: 1,
      marginLeft: 12,
    },
    selectionModalItemTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: palette.listItemText,
    },
    selectionModalItemMeta: {
      fontSize: 12,
      lineHeight: 18,
      color: palette.listItemSubtitleText,
      marginTop: 2,
    },
    searchEmptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      paddingVertical: 36,
    },
    searchEmptyStateTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: palette.textPrimary,
      marginTop: 10,
      marginBottom: 4,
      textAlign: 'center',
    },
    searchEmptyStateText: {
      fontSize: 13,
      lineHeight: 18,
      color: palette.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    sectionLoader: {
      marginTop: 18,
    },
  });

export const useGeneralSettingsStyles = () => {
  const themeStore = useStore('theme');
  const peopleStore = useStore('people');
  const themeColors = useMemo(
    () => ({
      ...normalizeGeneralSettingsThemeColors(themeStore.getters.colors),
      ...normalizeGeneralSettingsThemeColors(
        peopleStore.getters.currentCompany?.theme?.colors,
      ),
    }),
    [
      themeStore.getters.colors,
      peopleStore.getters.currentCompany?.id,
      peopleStore.getters.currentCompany?.theme?.colors,
    ],
  );
  const palette = useMemo(
    () => buildGeneralSettingsPalette(themeColors),
    [themeColors],
  );

  return useMemo(() => createGeneralSettingsStyles(palette), [palette]);
};

export const useGeneralSettingsPalette = () => {
  const themeStore = useStore('theme');
  const peopleStore = useStore('people');

  const themeColors = useMemo(
    () => ({
      ...normalizeGeneralSettingsThemeColors(themeStore.getters.colors),
      ...normalizeGeneralSettingsThemeColors(
        peopleStore.getters.currentCompany?.theme?.colors,
      ),
    }),
    [
      themeStore.getters.colors,
      peopleStore.getters.currentCompany?.id,
      peopleStore.getters.currentCompany?.theme?.colors,
    ],
  );

  return useMemo(
    () => buildGeneralSettingsPalette(themeColors),
    [themeColors],
  );
};

const legacyPalette = {
  badgeBorder: '#FCA5A5',
  badgeDisabledBackground: '#FEE2E2',
  badgeDisabledText: '#991B1B',
  badgeSelectedBackground: '#DCFCE7',
  badgeSelectedBorder: '#86EFAC',
  badgeSelectedText: '#166534',
  buttonBackground: '#334155',
  buttonBackgroundSecondary: '#334155',
  buttonBorderSecondary: '#E2E8F0',
  buttonIcon: '#FFFFFF',
  buttonText: '#FFFFFF',
  buttonTextSecondary: '#FFFFFF',
  cardBackground: '#FFFFFF',
  cardBorder: '#E2E8F0',
  cardIconColor: '#0F766E',
  cardIconBackground: '#ECFEFF',
  cardIconBorder: '#A5F3FC',
  cardText: '#0F172A',
  containerTransparentBackground: 'transparent',
  error: '#c10015',
  iconActive: '#0F766E',
  iconDanger: '#c10015',
  iconDisabled: '#94A3B8',
  iconInfo: '#0369A1',
  iconSuccess: '#0F766E',
  iconWarning: '#B45309',
  info: '#0369A1',
  inputBackground: '#F8FAFC',
  inputBorder: '#CBD5E1',
  inputDisabledBackground: '#F1F5F9',
  inputDisabledText: '#64748B',
  inputIcon: '#94A3B8',
  inputPlaceholderText: '#94A3B8',
  inputText: '#0F172A',
  listItemBackground: '#F8FAFC',
  listItemBorder: '#E2E8F0',
  listItemSelectedBackground: '#EFF6FF',
  listItemSelectedBorder: '#93C5FD',
  listItemSubtitleText: '#64748B',
  listItemText: '#0F172A',
  loadingSpinner: '#64748B',
  modalBackground: '#FFFFFF',
  modalBorder: '#E2E8F0',
  modalCloseIcon: '#64748B',
  modalHeaderText: '#0F172A',
  modalText: '#64748B',
  navigationActiveBackground: '#F8FAFC',
  navigationBackground: '#FFFFFF',
  navigationBorder: '#E2E8F0',
  navigationText: '#94A3B8',
  pageBackground: '#F8FAFC',
  primary: '#1D4ED8',
  success: '#0F766E',
  switchDisabledThumb: '#94A3B8',
  switchDisabledTrack: '#E2E8F0',
  switchOffThumb: '#FFFFFF',
  switchOffTrack: '#CBD5E1',
  switchOnThumb: '#FFFFFF',
  switchOnTrack: '#2563EB',
  textMuted: '#64748B',
  textPrimary: '#334155',
  textSecondary: '#64748B',
  warning: '#B45309',
};

const localStyles = createGeneralSettingsStyles(legacyPalette);

export default localStyles;
