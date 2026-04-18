import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useSelector } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import Motion from '../components/motion';

export default function MatchScreen({ navigation }) {
  const { colors } = useTheme();
  const currentUserId = useSelector((state) => state.user.user?.uid);
  const mySkills = useSelector((state) => state.user.skills || []);
  const communitySkills = useSelector((state) => state.user.communitySkills || []);

  const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

  const myOffers = new Set(mySkills.filter((skill) => skill.type === 'offer').map((skill) => normalize(skill.title)));
  const myWants = new Set(mySkills.filter((skill) => skill.type === 'want').map((skill) => normalize(skill.title)));

  const matches = [];
  const seen = new Set();

  communitySkills.forEach((skill) => {
    const skillTitleKey = normalize(skill.title);
    if (!skillTitleKey || skill.ownerUid === currentUserId) {
      return;
    }

    if (skill.type === 'offer' && myWants.has(skillTitleKey)) {
      const matchKey = `${skill.ownerUid}:${skillTitleKey}:learn`;
      if (!seen.has(matchKey)) {
        seen.add(matchKey);
        matches.push({
          id: matchKey,
          mentor: skill.ownerName || 'Community member',
          mentorUid: skill.ownerUid,
          skillTitle: skill.title,
          direction: 'learn',
          description: `${skill.ownerName || 'This user'} offers ${skill.title}, which you want to learn.`,
          ctaLabel: 'Schedule Session',
        });
      }
    }

    if (skill.type === 'want' && myOffers.has(skillTitleKey)) {
      const matchKey = `${skill.ownerUid}:${skillTitleKey}:teach`;
      if (!seen.has(matchKey)) {
        seen.add(matchKey);
        matches.push({
          id: matchKey,
          mentor: skill.ownerName || 'Community member',
          mentorUid: skill.ownerUid,
          skillTitle: skill.title,
          direction: 'teach',
          description: `${skill.ownerName || 'This user'} wants ${skill.title}, which you can offer.`,
          ctaLabel: 'Offer Session',
        });
      }
    }
  });

  const renderMatch = ({ item, index }) => (
    <Motion
      style={[styles.matchCard, { backgroundColor: colors.card, borderColor: colors.muted }]}
      variant="slide"
      delay={index * 70}
    >
      <Text style={[styles.matchName, { color: colors.primaryText }]}>{item.mentor}</Text>
      <Text style={[styles.matchSkill, { color: colors.secondaryText }]}>{item.skillTitle}</Text>
      <Text style={[styles.matchDescription, { color: colors.secondaryText }]}>{item.description}</Text>
      <View style={styles.matchActionsRow}>
        <Motion
          as="touchable"
          style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.muted }]}
          onPress={() =>
            navigation.navigate('Chat', {
              peerUid: item.mentorUid,
              peerName: item.mentor,
            })
          }
          variant="scale"
          activeOpacity={0.85}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.primaryText }]}>Chat First</Text>
        </Motion>
        <Motion
          as="touchable"
          style={[styles.scheduleButton, { backgroundColor: colors.accent }]}
          onPress={() =>
            navigation.navigate('Bookings', {
              mentor: item.mentor,
              mentorUid: item.mentorUid,
              skill: item.skillTitle,
            })
          }
          variant="scale"
          activeOpacity={0.85}
          delay={40}
        >
          <Text style={styles.scheduleButtonText}>{item.ctaLabel}</Text>
        </Motion>
      </View>
    </Motion>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Motion style={styles.headerSection} variant="fadeSlide">
        <Text style={[styles.title, { color: colors.primaryText }]}>Matches</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>People with complementary skills</Text>
      </Motion>

      {matches.length ? (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.matchesList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Motion style={styles.emptyStateContainer} variant="fadeScale" delay={120}>
          <Motion style={[styles.heartIcon, { backgroundColor: colors.card }]} variant="scale" delay={120}>
            <Text style={[styles.heartText, { color: colors.secondaryText }]}>♡</Text>
          </Motion>
          <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>No matches yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>Add skills to get matched with others</Text>
          <View style={styles.actionsRow}>
            <Motion
              as="touchable"
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.muted }]}
              onPress={() => navigation.navigate('Add')}
              variant="scale"
              activeOpacity={0.85}
            >
              <Text style={[styles.actionButtonText, { color: colors.primaryText }]}>Add Skills</Text>
            </Motion>
            <Motion
              as="touchable"
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.muted }]}
              onPress={() => navigation.navigate('Bookings')}
              variant="scale"
              delay={70}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionButtonText, { color: colors.primaryText }]}>View Bookings</Text>
            </Motion>
          </View>
        </Motion>
      )}
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
  matchesList: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 10,
  },
  matchCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  matchName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  matchSkill: {
    fontSize: 14,
    marginBottom: 8,
  },
  matchDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  scheduleButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heartIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heartText: {
    fontSize: 30,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  actionsRow: {
    marginTop: 16,
    width: '100%',
    gap: 10,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  matchActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
