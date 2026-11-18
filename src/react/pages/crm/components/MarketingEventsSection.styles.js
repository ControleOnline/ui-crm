import {StyleSheet} from 'react-native';
import {colors} from '@controleonline/../../src/styles/colors';

export default StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border || '#E0E0E0',
    backgroundColor: colors.white || '#FFFFFF',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.lightGray || '#F5F5F5',
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text || '#222',
  },
  chevron: {
    fontSize: 14,
    color: colors.grey || '#666',
    marginLeft: 8,
  },
  body: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
  },
  loader: {
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.grey || '#666',
    paddingVertical: 10,
  },
  errorBox: {
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.negative || '#C62828',
    marginBottom: 6,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  retryText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  eventCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary || '#1976D2',
    paddingLeft: 10,
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: colors.lightGray || '#FAFAFA',
    borderRadius: 6,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  eventName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text || '#222',
  },
  eventAt: {
    fontSize: 11,
    color: colors.grey || '#666',
  },
  utmLine: {
    marginTop: 4,
    fontSize: 12,
    color: colors.primary || '#1976D2',
  },
  pageUrl: {
    marginTop: 2,
    fontSize: 11,
    color: colors.grey || '#555',
  },
  metaLine: {
    marginTop: 2,
    fontSize: 11,
    color: colors.grey || '#777',
  },
});
