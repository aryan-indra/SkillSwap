import React from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Motion from '../components/motion';
import { useTheme } from '../contexts/ThemeContext';
import { fetchChatMessages, sendChatMessage } from '../services/firestoreService';
import { showError } from '../utils/notify';

export default function ChatThreadScreen({ route }) {
  const { colors } = useTheme();
  const currentUser = useSelector((state) => state.user.user);
  const chatId = route?.params?.chatId;
  const peerName = route?.params?.peerName || 'Conversation';
  const [messages, setMessages] = React.useState([]);
  const [messageText, setMessageText] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const loadMessages = React.useCallback(async () => {
    if (!chatId) {
      return;
    }
    try {
      const rows = await fetchChatMessages(chatId);
      setMessages(rows);
    } catch {
      showError('Unable to load messages', 'Please try again.');
    }
  }, [chatId]);

  useFocusEffect(
    React.useCallback(() => {
      void loadMessages();
      const timer = setInterval(() => {
        void loadMessages();
      }, 4000);
      return () => clearInterval(timer);
    }, [loadMessages])
  );

  const handleSend = async () => {
    const trimmed = messageText.trim();
    if (!trimmed) {
      return;
    }

    try {
      setSending(true);
      await sendChatMessage({
        chatId,
        senderUid: currentUser?.uid,
        senderName: currentUser?.name || currentUser?.email || 'You',
        text: trimmed,
      });
      setMessageText('');
      await loadMessages();
    } catch {
      showError('Unable to send message', 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const mine = item.senderUid === currentUser?.uid;
    return (
      <View style={[styles.messageRow, mine ? styles.mineRow : styles.peerRow]}>
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: mine ? colors.accent : colors.card,
              borderColor: colors.muted,
            },
          ]}
        >
          {!mine ? (
            <Text style={[styles.senderName, { color: colors.secondaryText }]}>{item.senderName}</Text>
          ) : null}
          <Text style={[styles.messageText, { color: mine ? '#fff' : colors.primaryText }]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.headerSection}>
        <Text style={[styles.title, { color: colors.primaryText }]}>{peerName}</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Chat before confirming a session</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <View style={[styles.composer, { borderColor: colors.muted, backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.input, { color: colors.primaryText }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.placeholder}
          value={messageText}
          onChangeText={setMessageText}
        />
        <Motion
          as="touchable"
          style={[styles.sendButton, { backgroundColor: colors.accent }, sending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending}
          variant="scale"
          activeOpacity={0.85}
        >
          <Text style={styles.sendButtonText}>{sending ? '...' : 'Send'}</Text>
        </Motion>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  messageRow: {
    flexDirection: 'row',
  },
  mineRow: {
    justifyContent: 'flex-end',
  },
  peerRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
  },
  senderName: {
    fontSize: 11,
    marginBottom: 3,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  composer: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sendButton: {
    minWidth: 64,
    minHeight: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
