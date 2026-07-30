import {useMemo} from 'react';
import {StyleSheet} from 'react-native';

import {useGeneralSettingsPalette} from '../../GeneralSettings.styles';

const createShopDomainShowcasesStyles = palette =>
  StyleSheet.create({
    tabsBlock: {
      marginBottom: 12,
    },
    tabsRow: {
      alignItems: 'center',
      gap: 8,
      paddingBottom: 2,
    },
    tabButton: {
      alignItems: 'center',
      backgroundColor: palette.listItemBackground,
      borderColor: palette.listItemBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      maxWidth: 260,
      minHeight: 38,
      paddingHorizontal: 12,
    },
    tabButtonActive: {
      backgroundColor: palette.buttonBackground,
      borderColor: palette.buttonBorder,
    },
    tabText: {
      color: palette.listItemText,
      fontSize: 12,
      fontWeight: '800',
      marginLeft: 6,
    },
    addTabButton: {
      alignItems: 'center',
      backgroundColor: palette.buttonBackground,
      borderColor: palette.buttonBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: 38,
      paddingHorizontal: 12,
    },
    addTabText: {
      color: palette.buttonText,
      fontSize: 12,
      fontWeight: '800',
      marginLeft: 5,
    },
    panel: {
      backgroundColor: palette.listItemBackground,
      borderColor: palette.listItemBorder,
      borderRadius: 14,
      borderWidth: 1,
      gap: 10,
      padding: 14,
    },
    panelHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    panelEyebrow: {
      color: palette.listItemSubtitleText,
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    panelTitle: {
      color: palette.listItemText,
      fontSize: 16,
      fontWeight: '900',
      marginTop: 2,
    },
    showcaseName: {
      color: palette.listItemSubtitleText,
      fontSize: 12,
      fontWeight: '700',
    },
    statusButton: {
      alignItems: 'center',
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: 34,
      paddingHorizontal: 10,
    },
    statusButtonActive: {
      backgroundColor: palette.badgeSelectedBackground,
      borderColor: palette.badgeSelectedBorder,
    },
    statusButtonInactive: {
      backgroundColor: palette.badgeDisabledBackground,
      borderColor: palette.badgeBorder,
    },
    statusButtonText: {
      fontSize: 11,
      fontWeight: '800',
      marginLeft: 5,
    },
    segmentedRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    segmentButton: {
      alignItems: 'center',
      backgroundColor: palette.listItemBackground,
      borderColor: palette.listItemBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: 36,
      paddingHorizontal: 12,
    },
    segmentButtonActive: {
      backgroundColor: palette.buttonBackground,
      borderColor: palette.buttonBorder,
    },
    segmentText: {
      color: palette.listItemText,
      fontSize: 12,
      fontWeight: '800',
      marginLeft: 6,
    },
    outlineButton: {
      alignItems: 'center',
      backgroundColor: palette.buttonBackground,
      borderColor: palette.buttonBorder,
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      minHeight: 42,
      paddingHorizontal: 12,
    },
    outlineButtonText: {
      color: palette.buttonText,
      fontSize: 12,
      fontWeight: '800',
      marginLeft: 6,
    },
    catalogList: {
      gap: 8,
      marginTop: 4,
    },
    catalogItem: {
      alignItems: 'center',
      backgroundColor: palette.listItemBackground,
      borderColor: palette.listItemBorder,
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: 46,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    catalogItemActive: {
      backgroundColor: palette.buttonBackground,
      borderColor: palette.buttonBorder,
    },
    catalogCopy: {
      flex: 1,
      marginLeft: 8,
    },
    catalogTitle: {
      color: palette.listItemText,
      fontSize: 12,
      fontWeight: '800',
    },
    catalogMeta: {
      color: palette.listItemSubtitleText,
      fontSize: 11,
      fontWeight: '700',
      marginTop: 2,
    },
    catalogEmpty: {
      backgroundColor: palette.inputBackground,
      borderColor: palette.inputBorder,
      borderRadius: 10,
      borderWidth: 1,
      minHeight: 42,
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    createPanel: {
      backgroundColor: palette.listItemBackground,
      borderColor: palette.listItemBorder,
      borderRadius: 14,
      borderWidth: 1,
      gap: 10,
      padding: 14,
    },
    domainInput: {
      backgroundColor: palette.inputBackground,
      borderColor: palette.inputBorder,
      borderRadius: 10,
      borderWidth: 1,
      color: palette.inputText,
      minHeight: 42,
      paddingHorizontal: 12,
    },
    createActions: {
      flexDirection: 'row',
      gap: 8,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: palette.buttonBackground,
      borderColor: palette.buttonBorder,
      borderRadius: 10,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      minHeight: 42,
      paddingHorizontal: 12,
    },
    primaryButtonText: {
      color: palette.buttonText,
      fontSize: 12,
      fontWeight: '800',
      marginLeft: 6,
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: palette.listItemBackground,
      borderColor: palette.listItemBorder,
      borderRadius: 10,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      minHeight: 42,
      paddingHorizontal: 12,
    },
    secondaryButtonText: {
      color: palette.listItemText,
      fontSize: 12,
      fontWeight: '800',
    },
    disabledButton: {
      opacity: 0.55,
    },
  });

const useShopDomainShowcasesStyles = () => {
  const palette = useGeneralSettingsPalette();

  return useMemo(() => createShopDomainShowcasesStyles(palette), [palette]);
};

export default useShopDomainShowcasesStyles;
