/*
 * @agents Colors of the shared conversation (requests, Support, CRM): always from the system theme
 * (theme store + company theme), never fixed. WhatsApp-like roles map onto theme tokens.
 */
import {useMemo} from 'react';
import {useGeneralSettingsPalette} from '../../pages/settings/GeneralSettings.styles';
import {withOpacity} from '@controleonline/../../src/styles/branding';

export default function useChatPalette() {
  const t = useGeneralSettingsPalette();

  return useMemo(() => {
    const primary = t.primary || t.buttonBackground;
    return {
      ...t,
      primary,
      background: t.pageBackground,
      panel: t.cardBackground || t.pageBackground,
      border: t.cardBorder || t.listItemBorder,
      text: t.textPrimary || t.cardText,
      muted: t.textMuted || t.textSecondary,
      // Own messages: primary bubble; others: card bubble; internal notes: warning tint.
      mineBubble: withOpacity(primary, 0.9),
      mineText: t.buttonText || t.textPrimary,
      otherBubble: t.cardBackground || t.listItemBackground,
      otherText: t.textPrimary || t.cardText,
      noteBubble: withOpacity(t.warning || primary, 0.18),
      noteBorder: t.warning || primary,
      chip: t.badgeDisabledBackground || withOpacity(primary, 0.12),
      chipText: t.textSecondary || t.textPrimary,
      chipActive: primary,
      chipActiveText: t.buttonText || t.textPrimary,
      input: t.inputBackground || t.cardBackground,
      inputBorder: t.inputBorder || t.cardBorder,
      inputText: t.inputText || t.textPrimary,
      placeholder: t.inputPlaceholderText || t.textMuted,
      danger: t.error || t.iconDanger,
      success: t.success || t.iconSuccess,
    };
  }, [t]);
}
