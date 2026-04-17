import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
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
  headerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  required: {
    color: '#FF4444',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
  },
  selectInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectInputText: {
    fontSize: 16,
    flex: 1,
    color: '#1A1A1A',
  },
  placeholderText: {
    color: '#999999',
  },
  dateContainer: {
    flexDirection: 'row',
  },
  selectInputDate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
  },
  yearInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#F8F9FA',
    textAlign: 'center',
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  selectedCountBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2529a1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  selectedCountText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    color: '#0F172A',
    paddingHorizontal: 8,
  },
  selectedProductsWrap: {
    marginTop: 12,
  },
  selectedProductChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE4FF',
    borderRadius: 12,
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  selectedProductTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  selectedProductMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  productResultsWrap: {
    marginTop: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  productRowSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F5FFF7',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  productMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  noProductsText: {
    paddingVertical: 8,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6C757D',
    alignItems: 'center',
    marginRight: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  createButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '55%',
    elevation: 10,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  pickerModalBody: {
    maxHeight: '100%',
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  selectOptionActive: {
    backgroundColor: '#F8F9FF',
  },
  selectOptionTextActive: {
    color: '#2529a1',
    fontWeight: '600',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionName: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
});

export default styles;

export const inlineStyle_482_6 = {
  justifyContent: 'flex-end',
};

export const inlineStyle_502_67 = {
  marginRight: 8,
};

export const inlineStyle_517_71 = {
  marginRight: 8,
};

export const inlineStyle_588_28 = {
  flex: 1,
};

export const inlineStyle_615_26 = {
  flex: 1,
};

