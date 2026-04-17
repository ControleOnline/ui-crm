import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  yearControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearStepButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  yearStepButtonText: {
    color: '#334155',
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '700',
  },
  yearInput: {
    width: 70,
    height: 32,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    textAlign: 'center',
    color: '#0F172A',
    fontWeight: '700',
    backgroundColor: '#fff',
    paddingVertical: 0,
    marginHorizontal: 2,
  },
  monthList: {
    paddingVertical: 2,
  },
  monthChip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  monthChipActive: {
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
  },
  monthChipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  monthChipTextActive: {
    color: '#0369A1',
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F44336',
    marginBottom: 6,
  },
  errorSubtitle: {
    color: '#F44336',
    marginBottom: 14,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  listContainer: {
    padding: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusPill: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  amount: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 17,
    fontWeight: '700',
    color: '#007AFF',
  },
  metaLine: {
    color: '#475569',
    marginBottom: 4,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 24,
    gap: 16,
  },
  modalSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 12,
  },
  modalStatusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  modalStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  modalDetailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalDetailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  modalGroupBlock: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalGroupTitle: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  modalGroupAmount: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  modalCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  modalCategoryText: {
    flex: 1,
    color: '#475569',
    fontSize: 12,
    marginRight: 8,
  },
  modalCategoryAmount: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  modalEmptyText: {
    color: '#64748B',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  modalPrimaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default styles;

export const inlineStyle_353_8 = {
  justifyContent: 'flex-end',
};

export const inlineStyle_365_47 = {
  paddingBottom: 20,
};


