import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEEAE5',
  },
  header: {
    backgroundColor: '#26C865',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  backButton: {
    marginRight: 12,
    padding: 6,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 10,
    paddingBottom: 14,
  },
  messagesContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyStateIconCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#E7EDF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: '#334155',
    fontWeight: '400',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  dateText: {
    backgroundColor: '#D9D4CD',
    color: '#73808F',
    fontSize: 12,
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 12,
  },
  messageContainer: {
    marginVertical: 2,
    marginHorizontal: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 11,
    paddingTop: 8,
    paddingBottom: 7,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 1.5,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#D8F3C1',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
  },
  userMessageText: {
    color: '#111827',
  },
  otherMessageText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userMessageTime: {
    color: '#718175',
  },
  otherMessageTime: {
    color: '#8893A0',
  },
  inputContainer: {
    backgroundColor: '#F2F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E6EBF1',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 15,
    minHeight: 48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 1.5,
    elevation: 0,
  },
  textInput: {
    fontSize: 17,
    color: '#2A3440',
    paddingVertical: 10,
    borderWidth: 0,
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  sendButtonActive: {
    backgroundColor: '#2ECF6E',
  },
  sendButtonInactive: {
    backgroundColor: '#E7EBEF',
  },
});

export default styles;
