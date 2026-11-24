import { Platform, StyleSheet } from 'react-native';
import { colors } from '@controleonline/../../src/styles/colors';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingTop: Platform.OS === 'ios' ? 44 : 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  topAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  topTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },

  topSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },

  fixedInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  statusBox: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dateBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    marginHorizontal: 6,
  },

  dateLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  dateValue: { fontSize: 16, fontWeight: '700', color: '#0f172a' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  tabItem: { flex: 1, minHeight: 40, justifyContent: 'center', alignItems: 'center' },

  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },

  tabLabel: { fontSize: 15, fontWeight: '600', color: '#64748b' },

  tabLabelActive: { color: colors.primary, fontWeight: '700' },

  tabScroll: { flex: 1 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },

  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },

  centerContainer: { alignItems: 'center', paddingVertical: 60 },

  loadingText: { marginTop: 16, color: '#64748b', fontSize: 15 },

  errorText: { color: colors.error, textAlign: 'center', padding: 24 },

  htmlWrapper: { backgroundColor: '#fff' },

  fixedSignButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },

  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },

  signButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 12 },

  topSkeleton: { height: 100, backgroundColor: '#e2e8f0', margin: 16, borderRadius: 12 },

  infoSkeleton: {
    height: 140,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },

  tabsSkeleton: {
    height: 56,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
    borderRadius: 12,
  },
});

export default styles;

export const inlineStyle_17_10 = {
  flex: 1,
};

export const inlineStyle_159_14 = {
  flex: 1,
};

export const inlineStyle_219_14 = (
  {
    width: width,
  },
) => ({
  width,
  flex: 1,
});

export const inlineStyle_229_14 = (
  {
    width: width,
  },
) => ({
  width,
  flex: 1,
});

export const inlineStyle_27_8 = (
  {
    canEdit: canEdit,
  },
) => ({
  padding: 12,
  // Room for the fixed action bar (~60px) without wasting the document area.
  paddingBottom: canEdit ? 76 : 24,
});

export const inlineStyle_47_16 = {
  color: '#334155',
  lineHeight: 24,
};


