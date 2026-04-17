import { StyleSheet } from 'react-native';

const localStyles = StyleSheet.create({
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 18,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: '#F8FAFC',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  tabHelper: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    marginTop: 10,
    marginBottom: 18,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    marginRight: 12,
  },
  sectionHeaderCopy: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
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
    color: '#64748B',
    marginTop: 4,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusChipEnabled: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusChipDisabled: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  helperText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  emptyBox: {
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  printerList: {
    gap: 10,
  },
  printerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  printerItemActive: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  printerCopy: {
    flex: 1,
    marginLeft: 12,
  },
  printerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  printerDevice: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  primaryButton: {
    marginTop: 16,
    justifyContent: 'center',
  },
  secondaryButton: {
    marginTop: 10,
    justifyContent: 'center',
    backgroundColor: '#334155',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fieldBlock: {
    marginTop: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
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
    marginLeft: 10,
    padding: 4,
  },
  sectionLoader: {
    marginTop: 18,
  },
});

export default localStyles;
