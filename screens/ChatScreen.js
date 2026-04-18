import React, { useState } from "react";
import { View, Text, FlatList, TextInput, StyleSheet } from "react-native";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '../contexts/ThemeContext';
import Motion from '../components/motion';

const Tab = createMaterialTopTabNavigator();

const initialChats = [
  {
    id: '1',
    mentor: 'Alice Johnson',
    lastMessage: 'Hi! Ready for our Python session?',
    timestamp: '2 hours ago',
    unread: 2,
    archived: false,
  },
  {
    id: '2',
    mentor: 'Bob Smith',
    lastMessage: 'The React component looks good!',
    timestamp: '1 day ago',
    unread: 0,
    archived: false,
  },
  {
    id: '3',
    mentor: 'Charlie Brown',
    lastMessage: 'Let me know when you\'re free for mobile dev chat',
    timestamp: '3 days ago',
    unread: 1,
    archived: false,
  },
  {
    id: '4',
    mentor: 'Diana Prince',
    lastMessage: 'Great work on the ML project!',
    timestamp: '1 week ago',
    unread: 0,
    archived: true,
  },
];

function ChatList({ chats, onChatPress }) {
  const { colors } = useTheme();

  const renderChat = ({ item, index }) => (
    <Motion
      as="touchable"
      style={{ ...styles.chatItem, backgroundColor: colors.card }}
      onPress={() => onChatPress(item)}
      activeOpacity={0.85}
      variant="slide"
      delay={index * 80}
    >
      <View style={styles.chatContent}>
        <Text style={{ ...styles.mentorName, color: colors.primaryText }}>{item.mentor}</Text>
        <Text style={{ ...styles.lastMessage, color: colors.secondaryText }} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <View style={styles.chatMeta}>
        <Text style={{ ...styles.timestamp, color: colors.placeholder }}>{item.timestamp}</Text>
        {item.unread > 0 && (
          <View style={{ ...styles.unreadBadge, backgroundColor: colors.accent }}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        )}
      </View>
    </Motion>
  );

  return (
    <FlatList
      data={chats}
      renderItem={renderChat}
      keyExtractor={item => item.id}
      style={styles.chatList}
      showsVerticalScrollIndicator={false}
    />
  );
}

function AllChatsTab() {
  const { colors } = useTheme();
  const [chats] = useState(initialChats);
  const [searchText, setSearchText] = useState('');

  const filteredChats = chats.filter(chat =>
    chat.mentor.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleChatPress = (chat) => {
    // Navigate to chat detail (could be implemented later)
    console.log('Chat pressed:', chat.mentor);
  };

  return (
    <View style={{ ...styles.container, backgroundColor: colors.background }}>
      <Motion variant="fadeSlide" delay={40}>
        <TextInput
          style={{ ...styles.searchInput, backgroundColor: colors.card, color: colors.primaryText }}
          placeholder="Search mentors..."
          placeholderTextColor={colors.placeholder}
          value={searchText}
          onChangeText={setSearchText}
        />
      </Motion>
      <ChatList chats={filteredChats} onChatPress={handleChatPress} />
      {filteredChats.length === 0 && (
        <Motion style={styles.emptyState} variant="fade" delay={80}>
          <Text style={{ ...styles.emptyText, color: colors.secondaryText }}>No chats found</Text>
        </Motion>
      )}
    </View>
  );
}

function UnreadChatsTab() {
  const { colors } = useTheme();
  const [chats] = useState(initialChats);
  const [searchText, setSearchText] = useState('');

  const filteredChats = chats.filter(chat =>
    chat.unread > 0 && chat.mentor.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleChatPress = (chat) => {
    console.log('Chat pressed:', chat.mentor);
  };

  return (
    <View style={{ ...styles.container, backgroundColor: colors.background }}>
      <Motion variant="fadeSlide" delay={40}>
        <TextInput
          style={{ ...styles.searchInput, backgroundColor: colors.card, color: colors.primaryText }}
          placeholder="Search mentors..."
          placeholderTextColor={colors.placeholder}
          value={searchText}
          onChangeText={setSearchText}
        />
      </Motion>
      <ChatList chats={filteredChats} onChatPress={handleChatPress} />
      {filteredChats.length === 0 && (
        <Motion style={styles.emptyState} variant="fade" delay={80}>
          <Text style={{ ...styles.emptyText, color: colors.secondaryText }}>No unread chats</Text>
        </Motion>
      )}
    </View>
  );
}

function ArchivedChatsTab() {
  const { colors } = useTheme();
  const [chats] = useState(initialChats);
  const [searchText, setSearchText] = useState('');

  const filteredChats = chats.filter(chat =>
    chat.archived && chat.mentor.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleChatPress = (chat) => {
    console.log('Chat pressed:', chat.mentor);
  };

  return (
    <View style={{ ...styles.container, backgroundColor: colors.background }}>
      <Motion variant="fadeSlide" delay={40}>
        <TextInput
          style={{ ...styles.searchInput, backgroundColor: colors.card, color: colors.primaryText }}
          placeholder="Search mentors..."
          placeholderTextColor={colors.placeholder}
          value={searchText}
          onChangeText={setSearchText}
        />
      </Motion>
      <ChatList chats={filteredChats} onChatPress={handleChatPress} />
      {filteredChats.length === 0 && (
        <Motion style={styles.emptyState} variant="fade" delay={80}>
          <Text style={{ ...styles.emptyText, color: colors.secondaryText }}>No archived chats</Text>
        </Motion>
      )}
    </View>
  );
}

export default function ChatScreen() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarIndicatorStyle: {
          backgroundColor: colors.accent,
          height: 3,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tab.Screen name="All" component={AllChatsTab} />
      <Tab.Screen name="Unread" component={UnreadChatsTab} />
      <Tab.Screen name="Archived" component={ArchivedChatsTab} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
