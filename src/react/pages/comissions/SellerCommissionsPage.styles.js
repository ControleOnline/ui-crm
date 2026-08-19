import {StyleSheet} from 'react-native';

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
  },
  clientFilterRow: {
    marginTop: 10,
  },
  clientChips: {
    paddingVertical: 4,
  },
  clientChip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    maxWidth: 180,
  },
  clientChipActive: {
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  clientChipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  clientChipTextActive: {
    color: '#166534',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  errorSubtitle: {
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyTitle: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#64748B',
    textAlign: 'center',
  },
  listContent: {
    padding: 12,
    paddingBottom: 32,
  },
  monthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthCardTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
  monthCardCount: {
    color: '#64748B',
    fontSize: 12,
  },
  receiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  receiveLabel: {
    color: '#166534',
    fontWeight: '600',
    fontSize: 13,
  },
  receiveAmount: {
    color: '#15803D',
    fontWeight: '800',
    fontSize: 16,
  },
  senseHint: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 11,
  },
  detailsCard: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailClient: {
    color: '#334155',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  detailAmount: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default styles;
