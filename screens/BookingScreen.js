import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Motion from '../components/motion';
import { createBookingRequest, fetchBookingsForUser, updateBookingRequestStatus } from '../services/firestoreService';
import { showError, showSuccess } from '../utils/notify';

const Tab = createMaterialTopTabNavigator();
const DURATION_OPTIONS = [30, 60, 90];
const SLOT_WINDOW_DAYS = 7;

const toLocalIso = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatSlotDate = (date, timezone) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  }).format(date);

const formatSlotTime = (date, timezone) =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(date);

const formatSlotRange = (startDate, endDate, timezone) =>
  `${formatSlotDate(startDate, timezone)} • ${formatSlotTime(startDate, timezone)} - ${formatSlotTime(endDate, timezone)}`;

const hasSlotConflict = (bookings, slotStartIso, slotEndIso) => {
  const start = new Date(slotStartIso).getTime();
  const end = new Date(slotEndIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return true;
  }

  return bookings.some((booking) => {
    if (!['pending', 'confirmed'].includes(booking.status) || !booking.startAtIso || !booking.endAtIso) {
      return false;
    }
    const existingStart = new Date(booking.startAtIso).getTime();
    const existingEnd = new Date(booking.endAtIso).getTime();
    if (Number.isNaN(existingStart) || Number.isNaN(existingEnd)) {
      return false;
    }
    return start < existingEnd && end > existingStart;
  });
};

const buildAvailabilitySlots = ({ userBookings, mentorBookings, selectedDurationMinutes, timezone }) => {
  const now = new Date();
  const slotsByDay = [];

  for (let dayOffset = 0; dayOffset < SLOT_WINDOW_DAYS; dayOffset += 1) {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() + dayOffset);

    const daySlots = [];
    for (let hour = 9; hour <= 20; hour += 1) {
      for (const minute of [0, 30]) {
        const start = new Date(dayStart);
        start.setHours(hour, minute, 0, 0);
        const end = new Date(start.getTime() + selectedDurationMinutes * 60 * 1000);

        if (start.getTime() <= now.getTime()) {
          continue;
        }

        const slotStartIso = start.toISOString();
        const slotEndIso = end.toISOString();
        const busy = hasSlotConflict(userBookings, slotStartIso, slotEndIso) || hasSlotConflict(mentorBookings, slotStartIso, slotEndIso);

        daySlots.push({
          id: `${slotStartIso}:${selectedDurationMinutes}`,
          startAtIso: slotStartIso,
          endAtIso: slotEndIso,
          label: formatSlotRange(start, end, timezone),
          isAvailable: !busy,
        });
      }
    }

    if (daySlots.length) {
      slotsByDay.push({
        id: toLocalIso(dayStart),
        label: formatSlotDate(dayStart, timezone),
        slots: daySlots,
      });
    }
  }

  return slotsByDay;
};

function BookingList({ bookings, navigation, currentUserId, onAccept, onReject }) {
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

      <Text style={{ ...styles.mentorName, color: colors.secondaryText }}>
        with {item.requesterUid === currentUserId ? item.receiverName : item.requesterName}
      </Text>

      <View style={styles.bookingDetails}>
        <Text style={{ ...styles.detailText, color: colors.secondaryText }}>📅 {item.date}</Text>
        <Text style={{ ...styles.detailText, color: colors.secondaryText }}>🕐 {item.time}</Text>
        <Text style={{ ...styles.detailText, color: colors.secondaryText }}>⏱️ {item.duration}</Text>
      </View>

      {item.status === 'pending' && item.receiverUid === currentUserId ? (
        <View style={styles.pendingActions}>
          <Motion
            as="touchable"
            style={[styles.acceptButton, { backgroundColor: colors.success }]}
            onPress={() => onAccept(item.id)}
            activeOpacity={0.85}
            variant="scale"
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </Motion>
          <Motion
            as="touchable"
            style={[styles.rejectButton, { backgroundColor: '#ef4444' }]}
            onPress={() => onReject(item.id)}
            activeOpacity={0.85}
            variant="scale"
            delay={50}
          >
            <Text style={styles.actionButtonText}>Reject</Text>
          </Motion>
        </View>
      ) : null}

      {item.status === 'pending' && item.requesterUid === currentUserId ? (
        <Text style={[styles.pendingLabel, { color: colors.secondaryText }]}>Waiting for response</Text>
      ) : null}

      {item.status === 'completed' && (
        <Motion
          as="touchable"
          style={[styles.reviewButton, { backgroundColor: colors.accent }]}
          onPress={() =>
            navigation.navigate("Review", {
              mentor: item.requesterUid === currentUserId ? item.receiverName : item.requesterName,
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
      style={styles.bookingList}
      contentContainerStyle={styles.bookingListContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

function UpcomingBookingsTab({ navigation, route }) {
  const { colors } = useTheme();
  const bookings = route.params?.bookings || [];
  const currentUserId = route.params?.currentUserId;
  const onAccept = route.params?.onAccept;
  const onReject = route.params?.onReject;

  const upcomingBookings = bookings.filter(booking =>
    booking.status === 'confirmed' || booking.status === 'pending'
  );

  return (
    <View style={styles.container}>
      <BookingList
        bookings={upcomingBookings}
        navigation={navigation}
        currentUserId={currentUserId}
        onAccept={onAccept}
        onReject={onReject}
      />
      {upcomingBookings.length === 0 && (
        <Motion style={styles.emptyState} variant="fade" delay={80}>
          <Text style={{ ...styles.emptyText, color: colors.secondaryText }}>No upcoming bookings</Text>
          <Text style={{ ...styles.emptySubtext, color: colors.placeholder }}>Book a session to get started!</Text>
        </Motion>
      )}
    </View>
  );
}

function CompletedBookingsTab({ navigation, route }) {
  const { colors } = useTheme();
  const bookings = route.params?.bookings || [];
  const currentUserId = route.params?.currentUserId;
  const onAccept = route.params?.onAccept;
  const onReject = route.params?.onReject;

  const completedBookings = bookings.filter(booking =>
    booking.status === 'completed'
  );

  return (
    <View style={styles.container}>
      <BookingList
        bookings={completedBookings}
        navigation={navigation}
        currentUserId={currentUserId}
        onAccept={onAccept}
        onReject={onReject}
      />
      {completedBookings.length === 0 && (
        <Motion style={styles.emptyState} variant="fade" delay={80}>
          <Text style={{ ...styles.emptyText, color: colors.secondaryText }}>No completed bookings</Text>
          <Text style={{ ...styles.emptySubtext, color: colors.placeholder }}>Complete sessions to see them here</Text>
        </Motion>
      )}
    </View>
  );
}

function CancelledBookingsTab({ navigation, route }) {
  const { colors } = useTheme();
  const bookings = route.params?.bookings || [];
  const currentUserId = route.params?.currentUserId;
  const onAccept = route.params?.onAccept;
  const onReject = route.params?.onReject;

  const cancelledBookings = bookings.filter(booking =>
    booking.status === 'cancelled'
  );

  return (
    <View style={styles.container}>
      <BookingList
        bookings={cancelledBookings}
        navigation={navigation}
        currentUserId={currentUserId}
        onAccept={onAccept}
        onReject={onReject}
      />
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
  const { mentor, mentorUid, skill } = route.params || {};
  const { colors } = useTheme();
  const user = useSelector((state) => state.user.user);
  const [bookings, setBookings] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedDurationMinutes, setSelectedDurationMinutes] = React.useState(60);
  const [selectedSlot, setSelectedSlot] = React.useState(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = React.useState(false);
  const userTimezone = React.useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', []);
  const timezoneOffsetMinutes = new Date().getTimezoneOffset();

  const loadBookings = React.useCallback(async () => {
    if (!user?.uid) {
      return;
    }
    try {
      setLoading(true);
      const data = await fetchBookingsForUser(user.uid);
      setBookings(data);
    } catch {
      showError('Unable to load bookings', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    React.useCallback(() => {
      void loadBookings();
    }, [loadBookings])
  );

  React.useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDurationMinutes, mentorUid, skill]);

  const availabilityDays = React.useMemo(
    () =>
      buildAvailabilitySlots({
        userBookings: bookings,
        mentorBookings: [],
        selectedDurationMinutes,
        timezone: userTimezone,
      }),
    [bookings, selectedDurationMinutes, userTimezone]
  );

  const slotSummary = selectedSlot
    ? formatSlotRange(new Date(selectedSlot.startAtIso), new Date(selectedSlot.endAtIso), userTimezone)
    : '';

  const handleCreateRequest = async () => {
    if (!mentorUid || !skill || !mentor) {
      showError('Missing match details', 'Please schedule from a match card.');
      return;
    }
    if (!selectedSlot) {
      showError('Missing schedule details', 'Please select an available time slot.');
      return;
    }

    try {
      setIsSubmittingRequest(true);
      if (hasSlotConflict(bookings, selectedSlot.startAtIso, selectedSlot.endAtIso)) {
        throw new Error('This slot conflicts with one of your existing sessions.');
      }
      const slotStart = new Date(selectedSlot.startAtIso);
      const slotEnd = new Date(selectedSlot.endAtIso);
      await createBookingRequest({
        requesterUid: user.uid,
        requesterName: user.name || user.email || 'Unknown user',
        receiverUid: mentorUid,
        receiverName: mentor,
        skill,
        date: formatSlotDate(slotStart, userTimezone),
        time: `${formatSlotTime(slotStart, userTimezone)} - ${formatSlotTime(slotEnd, userTimezone)}`,
        duration: `${selectedDurationMinutes} mins`,
        startAtIso: selectedSlot.startAtIso,
        endAtIso: selectedSlot.endAtIso,
        timezone: userTimezone,
        timezoneOffsetMinutes,
      });
      setSelectedSlot(null);
      showSuccess('Request sent', `Session request sent to ${mentor}.`);
      await loadBookings();
      navigation.setParams({ mentor: undefined, mentorUid: undefined, skill: undefined });
    } catch (error) {
      showError('Unable to schedule', error?.message || 'Please try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleAccept = async (bookingId) => {
    try {
      await updateBookingRequestStatus({ bookingId, status: 'confirmed' });
      showSuccess('Request accepted', 'The session request is now confirmed.');
      await loadBookings();
    } catch {
      showError('Unable to accept', 'Please try again.');
    }
  };

  const handleReject = async (bookingId) => {
    try {
      await updateBookingRequestStatus({ bookingId, status: 'cancelled' });
      showSuccess('Request rejected', 'The session request was rejected.');
      await loadBookings();
    } catch {
      showError('Unable to reject', 'Please try again.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Motion style={styles.headerSection} variant="fadeSlide">
        <Text style={[styles.title, { color: colors.primaryText }]}>Bookings</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Track your upcoming and past sessions</Text>
      </Motion>

      {mentorUid && skill ? (
        <View style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.muted }]}>
          <Text style={[styles.requestTitle, { color: colors.primaryText }]}>Schedule with {mentor}</Text>
          <Text style={[styles.requestSkill, { color: colors.secondaryText }]}>Skill: {skill}</Text>
          <Text style={[styles.timezoneText, { color: colors.secondaryText }]}>Timezone: {userTimezone}</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((durationValue) => {
              const isActive = durationValue === selectedDurationMinutes;
              return (
                <Motion
                  key={durationValue}
                  as="touchable"
                  style={[
                    styles.durationChip,
                    {
                      borderColor: isActive ? colors.accent : colors.muted,
                      backgroundColor: isActive ? colors.accent : colors.card,
                    },
                  ]}
                  onPress={() => setSelectedDurationMinutes(durationValue)}
                  activeOpacity={0.85}
                  variant="scale"
                >
                  <Text style={[styles.durationChipText, { color: isActive ? '#fff' : colors.primaryText }]}>
                    {durationValue} mins
                  </Text>
                </Motion>
              );
            })}
          </View>
          <View style={styles.slotGroup}>
            {availabilityDays.length ? (
              availabilityDays.map((day) => (
                <View key={day.id} style={styles.slotDaySection}>
                  <Text style={[styles.slotDayLabel, { color: colors.primaryText }]}>{day.label}</Text>
                  <View style={styles.slotsWrap}>
                    {day.slots.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      return (
                        <Motion
                          key={slot.id}
                          as="touchable"
                          style={[
                            styles.slotChip,
                            {
                              borderColor: isSelected ? colors.accent : colors.muted,
                              backgroundColor: isSelected ? colors.accent : colors.card,
                              opacity: slot.isAvailable ? 1 : 0.5,
                            },
                          ]}
                          onPress={() => {
                            if (!slot.isAvailable) {
                              return;
                            }
                            setSelectedSlot(slot);
                          }}
                          activeOpacity={slot.isAvailable ? 0.85 : 1}
                          disabled={!slot.isAvailable}
                          variant="scale"
                        >
                          <Text style={[styles.slotChipText, { color: isSelected ? '#fff' : colors.primaryText }]}>
                            {slot.label}
                          </Text>
                        </Motion>
                      );
                    })}
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.noSlotsText, { color: colors.secondaryText }]}>No upcoming slots available.</Text>
            )}
          </View>
          <Text style={[styles.selectedSlotText, { color: colors.secondaryText }]}>
            {slotSummary ? `Selected: ${slotSummary}` : 'Select a slot to continue'}
          </Text>
          <Motion
            as="touchable"
            style={[styles.requestButton, { backgroundColor: colors.accent }, isSubmittingRequest && styles.requestButtonDisabled]}
            onPress={handleCreateRequest}
            disabled={isSubmittingRequest}
            variant="scale"
            activeOpacity={0.85}
          >
            <Text style={styles.requestButtonText}>{isSubmittingRequest ? 'Sending...' : 'Request Selected Slot'}</Text>
          </Motion>
        </View>
      ) : null}

      <View style={[styles.tabsContainer, { backgroundColor: colors.background }]}>
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
              textTransform: 'none',
            },
            tabBarStyle: {
              backgroundColor: colors.card,
              borderRadius: 10,
              marginHorizontal: 24,
              marginBottom: 14,
              elevation: 0,
              shadowOpacity: 0,
            },
            tabBarPressColor: 'transparent',
          }}
        >
          <Tab.Screen name="Upcoming" listeners={{ focus: () => loadBookings() }}>
            {(tabProps) => (
              <UpcomingBookingsTab
                {...tabProps}
                route={{
                  ...tabProps.route,
                  params: { bookings, currentUserId: user?.uid, onAccept: handleAccept, onReject: handleReject },
                }}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Completed" listeners={{ focus: () => loadBookings() }}>
            {(tabProps) => (
              <CompletedBookingsTab
                {...tabProps}
                route={{
                  ...tabProps.route,
                  params: { bookings, currentUserId: user?.uid, onAccept: handleAccept, onReject: handleReject },
                }}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Cancelled" listeners={{ focus: () => loadBookings() }}>
            {(tabProps) => (
              <CancelledBookingsTab
                {...tabProps}
                route={{
                  ...tabProps.route,
                  params: { bookings, currentUserId: user?.uid, onAccept: handleAccept, onReject: handleReject },
                }}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </View>
      {loading ? (
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Refreshing bookings...</Text>
      ) : null}
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
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  tabsContainer: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  requestCard: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestSkill: {
    fontSize: 13,
    marginBottom: 4,
  },
  timezoneText: {
    fontSize: 12,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  durationChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  slotGroup: {
    maxHeight: 260,
    gap: 10,
  },
  slotDaySection: {
    gap: 6,
  },
  slotDayLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  slotsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    borderWidth: 1,
    borderRadius: 999,
    minHeight: 30,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noSlotsText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  selectedSlotText: {
    fontSize: 12,
  },
  requestButton: {
    marginTop: 4,
    minHeight: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestButtonDisabled: {
    opacity: 0.65,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  bookingList: {
    flex: 1,
  },
  bookingListContent: {
    paddingBottom: 12,
  },
  bookingCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 17,
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
  },
  mentorName: {
    fontSize: 15,
    marginBottom: 10,
  },
  bookingDetails: {
    marginBottom: 10,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  acceptButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  pendingLabel: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  detailText: {
    fontSize: 14,
    marginBottom: 3,
  },
  reviewButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  emptyText: {
    fontSize: 17,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 12,
    paddingBottom: 8,
  },
});
