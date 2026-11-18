import {useMemo} from 'react';
import {StyleSheet} from 'react-native';
import useChatPalette from '../../components/conversation/useChatPalette';

/*
 * @agents Ticket funnel/modal styles. Colors come only from the theme (useChatPalette → theme store +
 * company theme); no color literals here (agents-mcp code-quality: theme tokens only).
 */
export const makeTicketStyles = p =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: p.background},
    header: {flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: p.border},
    headerText: {flex: 1, minWidth: 0},
    title: {color: p.text, fontSize: 18, fontWeight: '700'},
    subtitle: {color: p.muted, fontSize: 12, marginTop: 2},
    search: {minWidth: 180, maxWidth: 280, flex: 1, borderWidth: 1, borderColor: p.inputBorder, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, color: p.inputText, backgroundColor: p.input},
    board: {flex: 1},
    boardContent: {padding: 12, gap: 12},
    column: {width: 290, backgroundColor: p.panel, borderRadius: 12, borderTopWidth: 3, borderTopColor: p.primary, maxHeight: '100%'},
    columnHeader: {flexDirection: 'row', justifyContent: 'space-between', padding: 10},
    columnTitle: {color: p.text, fontWeight: '700', fontSize: 13, textTransform: 'capitalize'},
    columnCount: {color: p.muted, fontSize: 12},
    columnBody: {paddingHorizontal: 8, paddingBottom: 8},
    card: {backgroundColor: p.otherBubble, borderWidth: 1, borderColor: p.border, borderRadius: 10, padding: 10, marginBottom: 8},
    cardTitle: {color: p.text, fontSize: 13, fontWeight: '600'},
    cardMeta: {color: p.muted, fontSize: 11, marginTop: 4},
    badges: {flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6},
    badge: {borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: p.chip},
    badgeAi: {backgroundColor: p.chipActive},
    badgeText: {color: p.chipText, fontSize: 10, fontWeight: '600'},
    badgeAiText: {color: p.chipActiveText},
    cardActions: {flexDirection: 'row', gap: 6, marginTop: 8},
    iconBtn: {borderWidth: 1, borderColor: p.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4},
    iconBtnText: {color: p.text, fontSize: 12},
    emptyText: {color: p.muted, fontSize: 12, padding: 8},
    spinner: {marginTop: 24},
    input: {flex: 1, minHeight: 40, maxHeight: 140, borderWidth: 1, borderColor: p.inputBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, color: p.inputText, backgroundColor: p.input},
    primaryBtn: {backgroundColor: p.chipActive, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center'},
    primaryBtnText: {color: p.chipActiveText, fontWeight: '700'},
    ghostBtn: {borderWidth: 1, borderColor: p.chipActive, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8},
    ghostBtnText: {color: p.chipActive, fontWeight: '600', fontSize: 12},
    // modal
    modalBackdrop: {flex: 1, backgroundColor: p.overlay, justifyContent: 'center', alignItems: 'center', padding: 16},
    modalCard: {width: '100%', maxWidth: 480, backgroundColor: p.modalBackground || p.panel, borderRadius: 14, padding: 16, gap: 10},
    modalTitle: {color: p.modalHeaderText || p.text, fontSize: 16, fontWeight: '700'},
    modalText: {color: p.modalText || p.muted, fontSize: 13, lineHeight: 18},
    modalInput: {minHeight: 90, flex: 0},
    modalActions: {flexDirection: 'row', justifyContent: 'flex-end', gap: 8},
  });

export default function useTicketStyles() {
  const palette = useChatPalette();
  const styles = useMemo(() => makeTicketStyles(palette), [palette]);
  return {styles, palette};
}
