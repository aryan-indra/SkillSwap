import React from "react";
import { View, Text, FlatList, TextInput, StyleSheet } from "react-native";
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import Motion from '../components/motion';
import { fetchUserChatThreads, getOrCreateChatThread } from '../services/firestoreService';
import { showError } from '../utils/notify';

export default function ChatScreen({ navigation, route }) {
  const { colors } = useTheme();
  const user = useSelector((state) => state.user.user);
  const [searchText, setSearchText] = React.useState('');
  const [chats, setChats] = React.useState([]);

  const loadChats = React.useCallback(async () => {
    if (!user?.uid) {
      return;
    }
    try {
      const rows = await fetchUserChatThreads(user.uid);
      setChats(rows);
    } catch {
      showError('Unable to load chats', 'Please try again.');
    }
  }, [user?.uid]);

  useFocusEffect(
    React.useCallback(() => {
      void loadChats();
    }, [loadChats])
  );

  React.useEffect(() => {
    const peerUid = route?.params?.peerUid;
    const peerName = route?.params?.peerName;
    if (!peerUid || !user?.uid) {
      return;
    }

    const startChat = async () => {
      try {
        const thread = await getOrCreateChatThread({
          currentUser: user,
          peerUid,
          peerName: peerName || 'Community member',
        });
        navigation.navigate('ChatThread', {
          chatId: thread.id,
          peerName: peerName || 'Community member',
          peerUid,
        });
        navigation.setParams({ peerUid: undefined, peerName: undefined });
      } catch {
        showError('Unable to open chat', 'Please try again.');
      }
    };

    void startChat();
  }, [navigation, route?.params?.peerName, route?.params?.peerUid, user]);

  const filteredChats = chats.filter((chat) =>
    chat.peerName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerSection}>
        <Text style={[styles.title, { color: colors.primaryText }]}>Chat</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Talk with matched users before booking</Text>
      </View>
      <Motion variant="fadeSlide" delay={40}>
        <TextInput
          style={{ ...styles.searchInput, backgroundColor: colors.card, color: colors.primaryText }}
          placeholder="Search people..."
          placeholderTextColor={colors.placeholder}
          value={searchText}
          onChangeText={setSearchText}
        />
      </Motion>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Motion
            as="touchable"
            style={{ ...styles.chatItem, backgroundColor: colors.card }}
            onPress={() => navigation.navigate('ChatThread', { chatId: item.id, peerName: item.peerName, peerUid: item.peerUid })}
            activeOpacity={0.85}
            variant="slide"
            delay={index * 70}
          >
            <View style={styles.chatContent}>
              <Text style={{ ...styles.mentorName, color: colors.primaryText }}>{item.peerName}</Text>
              <Text style={{ ...styles.lastMessage, color: colors.secondaryText }} numberOfLines={1}>
                {item.lastMessage || 'Start the conversation'}
              </Text>
            </View>
          </Motion>
        )}
        style={styles.chatList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Motion style={styles.emptyState} variant="fade" delay={80}>
            <Text style={{ ...styles.emptyText, color: colors.secondaryText }}>No chats yet</Text>
          </Motion>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  searchInput: {
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  chatItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatContent: {
    flex: 1,
  },
  mentorName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 5,
  },
  lastMessage: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
  },
});
