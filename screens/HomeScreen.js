import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useSelector } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import Motion from '../components/motion';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const skills = useSelector((state) => state.user.communitySkills || []);
  const offeredSkills = skills.filter((skill) => skill.type === 'offer');

  const renderSkill = ({ item, index }) => (
    <Motion
      as="touchable"
      style={[styles.skillCard, { backgroundColor: colors.card, borderColor: colors.muted }]}
      onPress={() => navigation.navigate('Matches')}
      activeOpacity={0.85}
      variant="slide"
      delay={index * 70}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.skillName, { color: colors.primaryText }]}>{item.title}</Text>
        <Text style={[styles.skillHint, { color: colors.secondaryText }]}>Tap to view</Text>
      </View>
      <Text style={[styles.chevron, { color: colors.secondaryText }]}>›</Text>
    </Motion>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Motion style={styles.headerSection} variant="fadeSlide">
        <Text style={[styles.title, { color: colors.primaryText }]}>Explore</Text>
      </Motion>

      <FlatList
        data={offeredSkills}
        renderItem={renderSkill}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No community skills yet</Text>
          </View>
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
  },
  skillCard: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  skillHint: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 26,
    fontWeight: '300',
    marginLeft: 12,
  },
  emptyWrap: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
