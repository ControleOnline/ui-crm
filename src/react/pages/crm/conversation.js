import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Text} from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconMaterial from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useStore} from '@store';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import useToastMessage from '../../hooks/useToastMessage';
import {colors} from '@controleonline/../../src/styles/colors';

export default function CrmConversation() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const {showError} = useToastMessage();

  const opportunity = route.params?.opportunity || null;
  const taskInteractionsStore = useStore('tasksInterations');
  const getters = taskInteractionsStore?.getters || {};
  const actions = taskInteractionsStore?.actions || {};
  const items = getters?.items || [];
  const peopleStore = useStore('people');
  const peopleGetters = peopleStore?.getters || {};
  const people = peopleGetters?.items || [];

  const taskResource =
    opportunity?.['@id'] || (opportunity?.id ? `/tasks/${opportunity.id}` : null);

  const canSend = !!message.trim() && !!taskResource;
  const primaryColor = colors.primary || '#26C865';

  const normalizePeopleReference = value => {
    if (!value) {
      return '';
    }

    const rawValue = typeof value === 'object' ? value['@id'] ?? value.id : value;
    if (rawValue == null) {
      return '';
    }

    const normalized = String(rawValue).trim();
    if (!normalized) {
      return '';
    }

    if (normalized.startsWith('/people/') || normalized.startsWith('/peoples/')) {
      return normalized;
    }

    if (normalized.startsWith('/')) {
      return normalized;
    }

    if (/^\d+$/.test(normalized)) {
      return `/people/${normalized}`;
    }

    return normalized;
  };

  const clientName = useMemo(() => {
    const directName =
      opportunity?.client?.name ||
      opportunity?.client?.realname ||
      opportunity?.client?.alias ||
      opportunity?.clientName ||
      opportunity?.people?.name;

    if (directName) {
      return directName;
    }

    const clientRef = normalizePeopleReference(opportunity?.client);
    if (!clientRef || !Array.isArray(people)) {
      return global.t?.t('users','label', 'client', 'Cliente');
    }

    const linkedPerson = people.find(
      person => normalizePeopleReference(person) === clientRef,
    );

    return linkedPerson?.name || linkedPerson?.realname || global.t?.t('users','label', 'client', 'Cliente');
  }, [opportunity, people]);
  const formatTime = timestamp =>
    timestamp.toLocaleTimeString('pt-br', {
      hour: '2-digit',
      minute: '2-digit',
    });

  useEffect(() => {
    if (!opportunity) {
      showError(global.t?.t('users','error', 'opportunityNotFound', 'Oportunidade nao encontrada para abrir a conversa.'));
      navigation.goBack();
    }
  }, [opportunity, navigation, showError]);

  useEffect(() => {
    if (!taskResource || typeof actions.getItems !== 'function') {
      return;
    }

    actions.getItems({task: taskResource}).catch(error => {
      console.error('Erro ao carregar conversa:', error);
      showError(global.t?.t('users','error', 'loadMessages', 'Nao foi possivel carregar as mensagens da conversa.'));
    });
  }, [taskResource, actions, showError]);

  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) {
      setMessages([]);
      return;
    }

    const transformedMessages = items
      .filter(item => item?.body && item.body !== 'null')
      .map(item => ({
        id: item.id,
        text: String(item.body).replace(/"/g, ''),
        timestamp: new Date(item.createdAt),
        isFromUser: item.visibility === 'private',
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    setMessages(transformedMessages);
  }, [items]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({animated: true});
      });
    }
  }, [messages]);

  const formatDate = timestamp => {
    const today = new Date();
    const messageDate = new Date(timestamp);

    if (messageDate.toDateString() === today.toDateString()) {
      return global.t?.t('users','date', 'today', 'Hoje');
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return global.t?.t('users','date', 'yesterday', 'Ontem');
    }

    return messageDate.toLocaleDateString('pt-br', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const sendMessage = async () => {
    if (!canSend || typeof actions.save !== 'function') {
      return;
    }

    try {
      await actions.save({
        body: message.trim(),
        file: null,
        task: taskResource,
        type: 'comment',
        visibility: 'public',
      });

      setMessage('');
      await actions.getItems?.({task: taskResource});
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showError(global.t?.t('users','error', 'sendMessage', 'Nao foi possivel enviar a mensagem.'));
    }
  };

  const handleInputKeyPress = event => {
    const key = event?.nativeEvent?.key;
    const shift = !!event?.nativeEvent?.shiftKey;

    if (key === 'Enter' && !shift) {
      event?.preventDefault?.();
      sendMessage();
    }
  };

  const renderMessage = (msg, index) => {
    const showDate =
      index === 0 ||
      formatDate(msg.timestamp) !== formatDate(messages[index - 1].timestamp);

    return (
      <View key={msg.id || `${msg.timestamp}-${index}`}>
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 10),
            backgroundColor: primaryColor,
          },
        ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Icon name="user" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName}>
              {clientName}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={[
          styles.messagesContent,
          messages.length === 0 && styles.messagesContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}>
        {messages.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIconCircle}>
              <IconMaterial name="chat-bubble-outline" size={72} color="#94A3B8" />
            </View>
            <Text style={styles.emptyStateTitle}>
              {global.t?.t('users','state', 'emptyTitle', 'Nenhuma mensagem ainda')}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {global.t?.t('users','state', 'emptySubtitle', 'Inicie a conversa enviando a primeira mensagem.')}
            </Text>
          </View>
        ) : (
          messages.map((msg, index) => renderMessage(msg, index))
        )}
      </ScrollView>

      <View style={[styles.inputContainer, {paddingBottom: Math.max(insets.bottom, 8)}]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder={global.t?.t('users','placeholder', 'message', 'Digite uma mensagem...')}
            placeholderTextColor="#7A8794"
            multiline={false}
            maxLength={1000}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={sendMessage}
            onKeyPress={handleInputKeyPress}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            canSend ? styles.sendButtonActive : styles.sendButtonInactive,
          ]}
          onPress={sendMessage}
          disabled={!canSend}>
          <IconMaterial
            name="send"
            size={20}
            color={canSend ? '#FFFFFF' : '#B8C2CC'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

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


