import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '../contexts/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { addBooking } from '../store/userSlice';
import Motion from '../components/motion';

const Tab = createMaterialTopTabNavigator();

function BookingList({ bookings, navigation }) {
  const { colors } = useTheme();
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return '#FF9500';
      case 'completed': return colors.accent;
      case 'cancelled': return '#FF3B30';
      default: return colors.secondaryText;
    }
  };

  const renderBooking = ({ item, index }) => (
    <Motion style={{ ...styles.bookingCard, backgroundColor: colors.card }} variant="slide" delay={index * 80}>
      <View style={styles.bookingHeader}>
        <Text style={{ ...styles.skillName, color: colors.primaryText }}>{item.skill}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>

      <Text style={{ ...styles.mentorName, color: colors.secondaryText }}>with {item.mentor}</Text>

      <View style={styles.bookingDetails}>
        <Text style={{ ...styles.detailText, color: colors.secondaryText }}>📅 {item.date}</Text>
        <Text style={{ ...styles.detailText, color: colors.secondaryText }}>🕐 {item.time}</Text>
        <Text style={{ ...styles.detailText, color: colors.secondaryText }}>⏱️ {item.duration}</Text>
      </View>

      {item.status === 'completed' && (
        <Motion
          as="touchable"
          style={[styles.reviewButton, { backgroundColor: colors.accent }]}
          onPress={() =>
            navigation.navigate("Review", {
              mentor: item.mentor,
              bookingId: item.id
            })
          }
          activeOpacity={0.85}
          variant="scale"
          delay={80}
        >
          <Text style={styles.reviewButtonText}>Leave Review</Text>
        </Motion>
      )}
    </Motion>
  );

  return (
    <FlatList
      data={bookings}
      renderItem={renderBooking}
      keyExtractor={item => item.id}
      style={{ ...styles.bookingList, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    />
  );
}

function UpcomingBookingsTab({ navigation }) {
  const { colors } = useTheme();
  const bookings = useSelector((state) => state.user.bookings);

  const upcomingBookings = bookings.filter(booking =>
    booking.status === 'confirmed' || booking.status === 'pending'
  );

  return (
    <View style={styles.container}>
      <BookingList bookings={upcomingBookings} navigation={navigation} />
      {upcomingBookings.length === 0 && (
        <Motion style={styles.emptyState} variant="fade" delay={80}>
          <Text style={{ ...styles.emptyText, color: colors.secondaryText }}>No upcoming bookings</Text>
          <Text style={{ ...styles.emptySubtext, color: colors.placeholder }}>Book a session to get started!</Text>
        </Motion>
      )}
    </View>
  );
}

function CompletedBookingsTab({ navigation }) {
  const { colors } = useTheme();
  const bookings = useSelector((state) => state.user.bookings);

  const completedBookings = bookings.filter(booking =>
    booking.status === 'completed'
  );

  return (
    <View style={styles.container}>
      <BookingList bookings={completedBookings} navigation={navigation} />
      {completedBookings.length === 0 && (
        <Motion style={styles.emptyState} variant="fade" delay={80}>
          <Text style={{ ...styles.emptyText, color: colors.secondaryText }}>No completed bookings</Text>
          <Text style={{ ...styles.emptySubtext, color: colors.placeholder }}>Complete sessions to see them here</Text>
        </Motion>
      )}
    </View>
  );
}

function CancelledBookingsTab({ navigation }) {
  const { colors } = useTheme();
  const bookings = useSelector((state) => state.user.bookings);

  const cancelledBookings = bookings.filter(booking =>
    booking.status === 'cancelled'
  );

  return (
    <View style={styles.container}>
      <BookingList bookings={cancelledBookings} navigation={navigation} />
      {cancelledBookings.length === 0 && (
        <Motion style={styles.emptyState} variant="fade" delay={80}>
          <Text style={{ ...styles.emptyText, color: colors.secondaryText }}>No cancelled bookings</Text>
          <Text style={{ ...styles.emptySubtext, color: colors.placeholder }}>Cancelled sessions will appear here</Text>
        </Motion>
      )}
    </View>
  );
}

export default function BookingScreen({ route, navigation }) {
  const { mentor, skill } = route.params || {};
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const bookings = useSelector((state) => state.user.bookings);

  // If coming from match screen, add new booking
  React.useEffect(() => {
    if (mentor && skill) {
      const alreadyExists = bookings.some(
        (item) => item.mentor === mentor && item.skill === skill && item.status === 'pending'
      );

      if (alreadyExists) {
        return;
      }

      const newBooking = {
        id: Date.now().toString(),
        mentor,
        skill,
        date: '2024-02-28',
        time: '10:00 AM',
        status: 'pending',
        duration: '1 hour'
      };

      dispatch(addBooking(newBooking));
    }
  }, [mentor, skill, bookings, dispatch]);

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
      <Tab.Screen name="Upcoming" component={UpcomingBookingsTab} />
      <Tab.Screen name="Completed" component={CompletedBookingsTab} />
      <Tab.Screen name="Cancelled" component={CancelledBookingsTab} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  darkContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  bookingList: {
    flex: 1,
  },
  darkBookingList: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  bookingCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkBookingCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  darkSkillName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e0e0e0',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  mentorName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  darkMentorName: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 10,
  },
  bookingDetails: {
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  darkDetailText: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 3,
  },
  reviewButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#fff',
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
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
});
