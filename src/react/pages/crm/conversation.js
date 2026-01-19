import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {Text} from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconMaterial from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useStore} from '@store';

export default function CrmConversation() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const scrollViewRef = useRef();
  const navigation = useNavigation();
  const route = useRoute();
  const {opportunity} = route.params;
  const tasksInterationsStore = useStore('tasksInterations');
  const getters = tasksInterationsStore.getters;
  const actions = tasksInterationsStore.actions;
  const {items} = getters;

  const formatTime = timestamp => {
    return timestamp.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    actions.getItems({task: opportunity.id});
  }, [opportunity.id]);

  useEffect(() => {
    if (items && items.length > 0) {
      const transformedMessages = items
        .filter(item => item.body && item.body !== 'null')
        .map(item => ({
          id: item.id,
          text: item.body.replace(/"/g, ''), // Remove quotes from body
          timestamp: new Date(item.createdAt),
          isFromUser: item.visibility === 'private', // Assuming private messages are from current user
          author:
            item.registeredBy?.name || item.registeredBy?.alias || 'Usuário',
        }))
        .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp

      setMessages(transformedMessages);
    }
  }, [items]);

  const formatDate = timestamp => {
    const today = new Date();
    const messageDate = new Date(timestamp);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hoje';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }

    return messageDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const sendMessage = () => {
    if (!message.trim()) {
      return;
    }

    actions.save({
      body: message.trim(),
      file: null,
      task: opportunity['@id'],
      type: 'comment',
      visibility: 'private',
    });

    setMessage(''); // Clear input after sending
  };

  const renderMessage = (msg, index) => {
    const showDate =
      index === 0 ||
      formatDate(msg.timestamp) !== formatDate(messages[index - 1].timestamp);

    return (
      <View key={msg.id}>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(msg.timestamp)}</Text>
          </View>
        )}

        <View
          style={[
            styles.messageContainer,
            msg.isFromUser ? styles.userMessage : styles.otherMessage,
          ]}>
          <View
            style={[
              styles.messageBubble,
              msg.isFromUser ? styles.userBubble : styles.otherBubble,
            ]}>
            <Text
              style={[
                styles.messageText,
                msg.isFromUser
                  ? styles.userMessageText
                  : styles.otherMessageText,
              ]}>
              {msg.text}
            </Text>
            <Text
              style={[
                styles.messageTime,
                msg.isFromUser
                  ? styles.userMessageTime
                  : styles.otherMessageTime,
              ]}>
              {formatTime(msg.timestamp)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Icon name="user" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName}>
              {opportunity.client?.name || 'Cliente'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}>
        {messages.map((msg, index) => renderMessage(msg, index))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Digite uma mensagem..."
            placeholderTextColor="#7f8c8d"
            multiline
            maxLength={1000}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            message.trim()
              ? styles.sendButtonActive
              : styles.sendButtonInactive,
          ]}
          onPress={sendMessage}
          disabled={!message.trim()}>
          <IconMaterial
            name="send"
            size={20}
            color={message.trim() ? '#FFFFFF' : '#bdc3c7'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e5ddd5',
  },
  header: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    marginLeft: 20,
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    color: '#7f8c8d',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginVertical: 2,
    marginHorizontal: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#dcf8c6',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#000000',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userMessageTime: {
    color: '#7f8c8d',
  },
  otherMessageTime: {
    color: '#7f8c8d',
  },
  inputContainer: {
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  attachButton: {
    marginRight: 8,
    padding: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
    paddingVertical: 4,
  },
  emojiButton: {
    marginLeft: 8,
    padding: 4,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonActive: {
    backgroundColor: '#25D366',
  },
  sendButtonInactive: {
    backgroundColor: '#e0e0e0',
  },
});
